import Link from "next/link";
import { redirect } from "next/navigation";
import { getRoster, getRounds, getSettings, insertRound } from "@/lib/store";
import { parseUdiscUrl, matchPlayer } from "@/lib/udisc";
import { submitRoundAction } from "@/app/actions";
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
  const auto = params.auto === "1" || !!sharedMatch;

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

  // AUTO-SUBMIT: if ?auto=1 or shared-from-UDisc, and the parse is clean + all players matched + not a dup, just save
  if (auto && preview?.ok && scorecardId) {
    const rounds = await getRounds();
    if (rounds.some((r) => r.id === scorecardId)) {
      redirect(`/rounds/${scorecardId}?dup=1`);
    }
    const allMatched = preview.entries.every((e) => suggestions.get(e.rawName));
    if (allMatched) {
      const results: RoundResult[] = preview.entries.map((e) => ({
        playerId: suggestions.get(e.rawName)!,
        position: e.position,
      }));
      const date = preview.date ?? new Date().toISOString().slice(0, 10);
      const round: Round = {
        id: scorecardId,
        date,
        season: Number(date.slice(0, 4)) || settings.currentSeason,
        source: "udisc",
        udiscUrl,
        courseName: preview.courseName,
        results,
        createdAt: new Date().toISOString(),
      };
      await insertRound(round);
      redirect(`/rounds/${scorecardId}?new=1`);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const date = preview?.ok && preview.date ? preview.date : today;
  const defaultPositions: Record<string, number> = {};
  if (preview?.ok) {
    for (const e of preview.entries) {
      const pid = suggestions.get(e.rawName);
      if (pid) defaultPositions[pid] = e.position;
    }
  }
  const unmatched = preview?.ok
    ? preview.entries.filter((e) => !suggestions.get(e.rawName))
    : [];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-2xl font-bold text-forest-800">Add a round</h2>
        <p className="text-sm text-forest-600">
          No sign-in needed. Paste a UDisc scorecard, we&apos;ll figure out the rest.
        </p>
      </header>

      <section className="card p-5">
        <PasteUdiscBox action="/api/preview" />
        {params.err === "nourl" && (
          <p className="mt-2 text-sm text-red-700">Paste a UDisc URL first.</p>
        )}
        {params.err === "toofew" && (
          <p className="mt-2 text-sm text-red-700">Need at least two players with positions.</p>
        )}
      </section>

      {preview && !preview.ok && (
        <div className="card p-4 border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-900">
            <strong>Couldn&apos;t parse that link.</strong> {preview.warning ?? ""} You can still fill in positions manually below.
          </p>
        </div>
      )}

      {preview?.ok && (
        <section className="card p-4">
          <h3 className="font-display font-bold text-forest-800">Found: {preview.courseName ?? "UDisc round"}</h3>
          <p className="text-sm text-forest-600 mb-3">
            {preview.entries.length} player{preview.entries.length === 1 ? "" : "s"}
            {preview.date ? ` · ${preview.date}` : ""}
          </p>
          <ul className="text-sm space-y-1">
            {preview.entries.map((e) => {
              const pid = suggestions.get(e.rawName);
              const p = pid ? roster.find((x) => x.id === pid) : null;
              return (
                <li key={`${e.position}-${e.rawName}`} className="flex justify-between gap-3">
                  <span>
                    #{e.position} <strong>{e.rawName}</strong>
                    {e.username ? <span className="text-forest-500"> (@{e.username})</span> : null}
                    {e.score != null ? <span className="text-forest-500"> · {e.score}</span> : null}
                  </span>
                  <span className={p ? "text-forest-600" : "text-amber-700"}>
                    {p ? `→ ${p.name}` : "→ no match"}
                  </span>
                </li>
              );
            })}
          </ul>
          {unmatched.length > 0 && (
            <p className="mt-3 text-xs text-amber-700">
              Unmatched players won&apos;t count. Ask an admin to add them in the <Link href="/admin" className="underline">roster</Link>, or assign below.
            </p>
          )}
        </section>
      )}

      <form action={submitRoundAction} className="space-y-4">
        <section className="card p-5 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <label className="text-sm">
              <span className="block text-forest-700 mb-1">Date</span>
              <input
                name="date"
                type="date"
                defaultValue={date}
                required
                className="input-pill"
              />
            </label>
            <label className="text-sm">
              <span className="block text-forest-700 mb-1">Season</span>
              <input
                name="season"
                type="number"
                defaultValue={settings.currentSeason}
                required
                className="input-pill"
              />
            </label>
            <label className="text-sm col-span-2 sm:col-span-1">
              <span className="block text-forest-700 mb-1">Course</span>
              <input
                name="courseName"
                defaultValue={preview?.ok ? preview.courseName ?? "" : ""}
                placeholder="Optional"
                className="input-pill"
              />
            </label>
          </div>
          <input type="hidden" name="udiscUrl" value={udiscUrl} />
          <input type="hidden" name="source" value={udiscUrl ? "udisc" : "manual"} />
          {scorecardId && <input type="hidden" name="roundId" value={scorecardId} />}
          <label className="block text-sm">
            <span className="block text-forest-700 mb-1">Note (optional)</span>
            <input
              name="note"
              className="input-pill"
              placeholder="Rain shortened to 9, etc."
            />
          </label>
        </section>

        <section className="card p-4">
          <h3 className="font-display font-bold text-forest-800">Positions</h3>
          <p className="text-sm text-forest-600 mb-3">
            Enter finishing position for each player who played. Leave blank for non-players. Ties: same number.
          </p>
          <ul className="divide-y divide-forest-100">
            {roster.map((p) => (
              <li key={p.id} className="py-2 flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-sm font-medium text-forest-800">{p.name}</div>
                  {p.udiscHandle && <div className="text-xs text-forest-500">@{p.udiscHandle}</div>}
                </div>
                <input
                  name={`pos_${p.id}`}
                  type="number"
                  min={1}
                  step={1}
                  defaultValue={defaultPositions[p.id] ?? ""}
                  className="w-20 rounded-lg border border-forest-200 bg-white px-2 py-1.5 text-sm text-center"
                  placeholder="—"
                />
              </li>
            ))}
          </ul>
        </section>

        <button type="submit" className="btn-primary w-full sm:w-auto">
          Save round
        </button>
      </form>
    </div>
  );
}
