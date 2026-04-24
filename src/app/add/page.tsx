import Link from "next/link";
import { redirect } from "next/navigation";
import { getRoster, getRounds, getSettings, insertRound, setPlayerActive, setPlayerAvatarIfMissing } from "@/lib/store";
import { parseUdiscUrl, matchPlayer } from "@/lib/udisc";
import { PasteUdiscBox } from "@/components/PasteUdiscBox";
import type { Round, RoundResult } from "@/lib/types";

type Params = {
  udiscUrl?: string;
  err?: string;
  auto?: string;
  text?: string; // shared via Android Web Share Target
};

export default async function AddPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  // Android Web Share Target may pass the URL in `text` instead of `udiscUrl`
  const sharedText = params.text ?? "";
  const sharedMatch = sharedText.match(/https?:\/\/udisc\.com\/scorecards\/[A-Za-z0-9_-]+[^\s]*/);
  const udiscUrl = (params.udiscUrl ?? sharedMatch?.[0] ?? "").trim();

  const [roster, settings] = await Promise.all([getRoster(), getSettings()]);

  let preview: Awaited<ReturnType<typeof parseUdiscUrl>> | null = null;
  const suggestions = new Map<string, string | null>();
  let scorecardId: string | null = null;
  if (udiscUrl) {
    preview = await parseUdiscUrl(udiscUrl);
    scorecardId = udiscUrl.match(/\/scorecards\/([A-Za-z0-9_-]+)/)?.[1] ?? null;
    if (preview.ok) {
      for (const e of preview.entries) {
        suggestions.set(e.rawName, matchPlayer(e.rawName, roster, e.username)?.id ?? null);
      }
    }
  }

  // Auto-submit every UDisc paste. Skip duplicates. Unmatched players are dropped —
  // admin can fix the roster and re-fetch.
  if (preview?.ok && scorecardId) {
    const rounds = await getRounds();
    if (rounds.some((r) => r.id === scorecardId)) {
      redirect(`/rounds/${scorecardId}?dup=1`);
    }
    const results: RoundResult[] = [];
    for (const e of preview.entries) {
      const pid = suggestions.get(e.rawName);
      if (!pid) continue;
      results.push({
        playerId: pid,
        position: e.position,
        score: e.score,
        relativeScore: e.relativeScore,
      });
      if (e.avatarUrl) await setPlayerAvatarIfMissing(pid, e.avatarUrl);
      const p = roster.find((x) => x.id === pid);
      if (p && !p.active) await setPlayerActive(pid, true);
    }
    if (results.length >= 2) {
      const date = preview.date ?? new Date().toISOString().slice(0, 10);
      const round: Round = {
        id: scorecardId,
        date,
        season: Number(date.slice(0, 4)) || settings.currentSeason,
        source: "udisc",
        udiscUrl,
        courseName: preview.courseName,
        variant: "standard",
        counts: true,
        temperatureC: preview.temperatureC,
        windKph: preview.windKph,
        results,
        createdAt: new Date().toISOString(),
      };
      await insertRound(round);
      redirect(`/rounds/${scorecardId}?new=1`);
    }
  }

  const unmatched = preview?.ok
    ? preview.entries.filter((e) => !suggestions.get(e.rawName))
    : [];
  const matchedCount = preview?.ok
    ? preview.entries.filter((e) => suggestions.get(e.rawName)).length
    : 0;

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-2xl font-bold text-forest-800">Add a round</h2>
        <p className="text-sm text-forest-600">
          Paste a UDisc scorecard link. We&apos;ll match players, pull scores and weather, and save it.
        </p>
      </header>

      <section className="card p-5">
        <PasteUdiscBox action="/api/preview" />
        {params.err === "nourl" && (
          <p className="mt-2 text-sm text-red-700">Paste a UDisc URL first.</p>
        )}
      </section>

      {preview && !preview.ok && (
        <div className="card p-4 border-red-200 bg-red-50">
          <p className="text-sm text-red-800">
            <strong>Couldn&apos;t parse that link.</strong> {preview.warning ?? "Double-check the URL is a public UDisc scorecard and try again."}
          </p>
        </div>
      )}

      {preview?.ok && matchedCount < 2 && (
        <div className="card p-4 border-amber-200 bg-amber-50 space-y-2">
          <p className="text-sm text-amber-900">
            <strong>Not enough roster players in this scorecard.</strong> We need at least two matched players to save.
          </p>
          <p className="text-sm text-amber-900">
            Unmatched: {unmatched.map((e) => e.rawName).join(", ") || "—"}
          </p>
          <p className="text-sm text-amber-900">
            Ask an admin to add them to the <Link href="/admin" className="underline font-semibold">roster</Link> (UDisc handles match automatically), then paste the link again.
          </p>
        </div>
      )}
    </div>
  );
}
