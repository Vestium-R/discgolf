import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getRoster, getRounds, insertRound } from "@/lib/store";
import type { Round, RoundResult } from "@/lib/types";
import { parseUdiscUrl, matchPlayer } from "@/lib/udisc";

/**
 * Runs daily via Vercel Cron (see vercel.json).
 * Reads scan_sources (a list of UDisc League URLs you add via /admin),
 * fetches each, extracts any new scorecard URLs, parses them, and auto-inserts
 * rounds that contain 2+ roster members.
 *
 * UDisc user profiles are NOT public (confirmed). This only works for UDisc
 * Leagues or Events, whose pages ARE public.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sb = supabaseAdmin();
  const { data: sources, error } = await sb
    .from("scan_sources")
    .select("*")
    .eq("enabled", true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!sources || sources.length === 0) {
    return NextResponse.json({ ok: true, sources: 0, note: "No scan sources configured. Add a UDisc League URL in admin." });
  }

  const roster = await getRoster();
  const existing = new Set((await getRounds()).map((r) => r.id));
  const report: unknown[] = [];

  for (const src of sources) {
    const added = await scanSource(src as ScanSource, roster, existing);
    await sb
      .from("scan_sources")
      .update({ last_scanned_at: new Date().toISOString() })
      .eq("id", src.id);
    await sb.from("scan_log").insert({ source_id: src.id, rounds_added: added.count, notes: added.notes });
    report.push({ source: src.url, added: added.count, notes: added.notes });
  }

  return NextResponse.json({ ok: true, report });
}

type ScanSource = { id: string; url: string; kind: string };

async function scanSource(
  src: ScanSource,
  roster: Awaited<ReturnType<typeof getRoster>>,
  existing: Set<string>
): Promise<{ count: number; notes: string }> {
  // Fetch the league/event page and pull out scorecard URLs from the HTML.
  let html: string;
  try {
    const res = await fetch(src.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PatchBot/1.0)" },
    });
    if (!res.ok) return { count: 0, notes: `HTTP ${res.status}` };
    html = await res.text();
  } catch (e) {
    return { count: 0, notes: `fetch failed: ${(e as Error).message}` };
  }

  const scorecardIds = [...new Set(Array.from(html.matchAll(/\/scorecards\/([A-Za-z0-9_-]+)/g)).map((m) => m[1]))];
  let added = 0;
  for (const id of scorecardIds) {
    if (existing.has(id)) continue;
    const parseUrl = `https://udisc.com/scorecards/${id}`;
    const parsed = await parseUdiscUrl(parseUrl);
    if (!parsed.ok) continue;

    const results: RoundResult[] = [];
    for (const e of parsed.entries) {
      const p = matchPlayer(e.rawName, roster, e.username);
      if (p) results.push({ playerId: p.id, position: e.position, score: e.score, relativeScore: e.relativeScore });
    }
    if (results.length < 2) continue; // Require 2+ roster members

    const round: Round = {
      id,
      date: parsed.date ?? new Date().toISOString().slice(0, 10),
      season: Number((parsed.date ?? new Date().toISOString()).slice(0, 4)),
      source: "udisc",
      udiscUrl: parseUrl,
      courseName: parsed.courseName,
      variant: "standard",
      counts: true,
      temperatureC: parsed.temperatureC,
      windKph: parsed.windKph,
      results,
      createdAt: new Date().toISOString(),
    };
    await insertRound(round);
    existing.add(id);
    added += 1;
  }
  return { count: added, notes: `${scorecardIds.length} scorecard URL(s) on page` };
}
