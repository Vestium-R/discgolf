import type { Player } from "./types";

export type ParsedEntry = {
  rawName: string;
  position: number;
  score?: number;
};

export type UdiscParseResult = {
  ok: boolean;
  url: string;
  courseName?: string;
  entries: ParsedEntry[];
  warning?: string;
};

/**
 * Best-effort UDisc leaderboard parser.
 * UDisc is a Next.js site; the page ships a __NEXT_DATA__ JSON blob we can
 * walk for leaderboard entries. Structure is not public API, so we fall back
 * gracefully: the UI lets the user confirm / edit the parsed order.
 */
export async function parseUdiscUrl(url: string): Promise<UdiscParseResult> {
  const fail = (warning: string): UdiscParseResult => ({ ok: false, url, entries: [], warning });
  let html: string;
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; KentDiscGolfBot/1.0; +https://github.com/)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return fail(`UDisc returned HTTP ${res.status}`);
    html = await res.text();
  } catch (e) {
    return fail(`Could not fetch UDisc page: ${(e as Error).message}`);
  }

  const nextData = extractNextData(html);
  if (!nextData) return fail("Could not find leaderboard data on page. Enter positions manually.");

  const entries = findLeaderboardEntries(nextData);
  if (entries.length === 0) return fail("Leaderboard looks empty or private. Enter positions manually.");

  const courseName = findCourseName(nextData) ?? undefined;
  return { ok: true, url, courseName, entries };
}

function extractNextData(html: string): unknown | null {
  const m = html.match(
    /<script id="__NEXT_DATA__" type="application\/json"[^>]*>([\s\S]*?)<\/script>/
  );
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

const NAME_KEYS = ["playerName", "name", "fullName", "displayName"];
const POS_KEYS = ["position", "place", "rank", "finishPlace", "finishPosition"];
const SCORE_KEYS = ["totalScore", "score", "totalToPar", "toPar"];

function findLeaderboardEntries(root: unknown): ParsedEntry[] {
  const candidates: ParsedEntry[][] = [];
  walk(root, (node) => {
    if (!Array.isArray(node) || node.length < 2) return;
    const parsed: ParsedEntry[] = [];
    for (const item of node) {
      if (!item || typeof item !== "object") return;
      const rec = item as Record<string, unknown>;
      const name = pickString(rec, NAME_KEYS);
      const pos = pickNumber(rec, POS_KEYS);
      if (!name || pos == null) return;
      parsed.push({
        rawName: name,
        position: pos,
        score: pickNumber(rec, SCORE_KEYS) ?? undefined,
      });
    }
    if (parsed.length >= 2) candidates.push(parsed);
  });
  if (candidates.length === 0) return [];
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0].sort((a, b) => a.position - b.position);
}

function findCourseName(root: unknown): string | null {
  let best: string | null = null;
  walk(root, (node) => {
    if (node && typeof node === "object" && !Array.isArray(node)) {
      const rec = node as Record<string, unknown>;
      const candidate = rec.courseName ?? rec.course_name;
      if (typeof candidate === "string" && candidate.length > 0 && !best) {
        best = candidate;
      }
    }
  });
  return best;
}

function pickString(o: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}

function pickNumber(o: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  }
  return null;
}

function walk(node: unknown, visit: (n: unknown) => void, depth = 0): void {
  if (depth > 12) return;
  visit(node);
  if (Array.isArray(node)) {
    for (const item of node) walk(item, visit, depth + 1);
  } else if (node && typeof node === "object") {
    for (const v of Object.values(node as Record<string, unknown>)) walk(v, visit, depth + 1);
  }
}

/** Fuzzy match a UDisc name to a roster player. */
export function matchPlayer(rawName: string, roster: Player[]): Player | null {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const target = norm(rawName);
  const targetParts = target.split(" ").filter(Boolean);

  for (const p of roster) {
    if (norm(p.name) === target) return p;
    if (p.udiscHandle && norm(p.udiscHandle) === target) return p;
  }
  for (const p of roster) {
    const pname = norm(p.name);
    const hname = p.udiscHandle ? norm(p.udiscHandle) : "";
    if (pname.includes(target) || target.includes(pname)) return p;
    if (hname && (hname.includes(target) || target.includes(hname))) return p;
  }
  for (const p of roster) {
    const pparts = norm(p.name).split(" ").filter(Boolean);
    if (pparts.some((pp) => targetParts.includes(pp) && pp.length >= 3)) return p;
  }
  return null;
}
