import Link from "next/link";
import { redirect } from "next/navigation";
import {
  getRoster,
  getRounds,
  getSettings,
  insertRound,
  setPlayerActive,
  setPlayerAvatarIfMissing,
} from "@/lib/store";
import { parseUdiscUrl, matchPlayer } from "@/lib/udisc";
import { PasteUdiscBox } from "@/components/PasteUdiscBox";
import { submitRoundAction, submitLinkedRoundAction } from "@/app/actions";
import type { Round, RoundResult } from "@/lib/types";
import type { PlayerId } from "@/lib/id-validation";

type Params = {
  udiscUrl?: string;
  err?: string;
  auto?: string;
  text?: string; // shared via Android Web Share Target
};

export default async function AddPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  // Extract a scorecard URL from wherever it arrives:
  //   - params.udiscUrl  (iOS shortcut passing URL directly, or passing whole text)
  //   - params.text      (Android Web Share Target)
  // UDisc's share sheet sends the whole share text (e.g. "Round at X\nhttps://udisc.com/…")
  // so we pull the scorecard URL out of whichever param has it.
  const scorecardRe = /https?:\/\/udisc\.com\/scorecards\/[A-Za-z0-9_-]+/;
  const rawParam = (params.udiscUrl ?? "").trim();
  const rawText  = (params.text ?? "").trim();
  const udiscUrl = (
    scorecardRe.exec(rawParam)?.[0] ??
    scorecardRe.exec(rawText)?.[0] ??
    rawParam
  );
  // Detect when the shortcut passed an image object instead of a URL
  const gotImage = !!rawParam && !udiscUrl.startsWith("http");

  const [roster, settings] = await Promise.all([getRoster(), getSettings()]);

  let preview: Awaited<ReturnType<typeof parseUdiscUrl>> | null = null;
  const suggestions = new Map<string, PlayerId | null>();
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

  const unmatched = preview?.ok ? preview.entries.filter((e) => !suggestions.get(e.rawName)) : [];
  const matchedCount = preview?.ok ? preview.entries.filter((e) => suggestions.get(e.rawName)).length : 0;
  const allMatched = preview?.ok && unmatched.length === 0;

  // Auto-submit only when every parsed player is on the roster (zero unmatched)
  if (allMatched && scorecardId && preview?.ok) {
    const rounds = await getRounds();
    if (rounds.some((r) => r.id === scorecardId)) {
      redirect(`/rounds/${scorecardId}?dup=1`);
    }
    const results: RoundResult[] = [];
    for (const e of preview.entries) {
      const pid = suggestions.get(e.rawName);
      if (!pid) continue;
      results.push({ playerId: pid, position: e.position, score: e.score, relativeScore: e.relativeScore });
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

  const activeRoster = roster.filter((p) => p.active);
  const today = new Date().toISOString().slice(0, 10);

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
        {params.err === "toofew" && (
          <p className="mt-2 text-sm text-red-700">Need at least 2 players — fill in more positions below.</p>
        )}
        {params.err === "bad" && (
          <p className="mt-2 text-sm text-red-700">Something went wrong — try again.</p>
        )}
      </section>

      {/* Shortcut sent an image instead of a URL */}
      {gotImage && !preview && (
        <div className="card p-4 border-amber-200 bg-amber-50 space-y-2">
          <p className="text-sm font-semibold text-amber-900">Your shortcut shared an image, not a link.</p>
          <p className="text-sm text-amber-800">
            UDisc&apos;s Card Cast shares a screenshot. You need to share the <strong>link</strong> instead:
          </p>
          <ol className="text-sm text-amber-800 space-y-1 pl-4 list-decimal">
            <li>Open the round in UDisc.</li>
            <li>Tap <strong>⋮</strong> → <strong>Share</strong> → <strong>Copy Link</strong>.</li>
            <li>Come back here and paste it in the box above.</li>
          </ol>
          <p className="text-xs text-amber-700 mt-1">
            Or update your shortcut — see <a href="/setup" className="underline font-semibold">Setup</a> for the fix.
          </p>
        </div>
      )}

      {/* Parse failed → show error + manual entry */}
      {preview && !preview.ok && (
        <>
          <div className="card p-4 border-red-200 bg-red-50">
            <p className="text-sm text-red-800">
              <strong>Couldn&apos;t parse that link.</strong>{" "}
              {preview.warning ?? "Double-check the URL is a public UDisc scorecard and try again."}
            </p>
          </div>

          <section className="card p-5 space-y-4 border-amber-200 bg-amber-50">
            <h3 className="font-display font-bold text-forest-800">Enter positions manually</h3>
            <form action={submitRoundAction} className="space-y-4">
              <input type="hidden" name="source" value="manual" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-forest-700 block mb-1">Date *</label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={today}
                    className="w-full border border-forest-300 rounded px-3 py-2 text-base"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-forest-700 block mb-1">Course</label>
                  <input
                    type="text"
                    name="courseName"
                    placeholder="optional"
                    className="w-full border border-forest-300 rounded px-3 py-2 text-base"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-forest-700">
                  Finishing position — leave blank if didn&apos;t play
                </p>
                {activeRoster.map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-sm text-forest-800 flex-1">{p.name}</span>
                    <input
                      type="number"
                      name={`pos_${p.id}`}
                      min={1}
                      max={20}
                      placeholder="—"
                      className="w-16 border border-forest-300 rounded px-2 py-2.5 text-base text-center"
                    />
                  </div>
                ))}
              </div>
              <button
                type="submit"
                className="w-full bg-forest-700 text-white rounded py-2 text-sm font-semibold hover:bg-forest-800"
              >
                Save Round
              </button>
            </form>
          </section>
        </>
      )}

      {/* Parse succeeded but some players unmatched → link form */}
      {preview?.ok && unmatched.length > 0 && (
        <section className="card p-5 space-y-4">
          <div>
            <h3 className="font-display font-bold text-forest-800">Who played?</h3>
            {preview.courseName && (
              <p className="text-sm text-forest-600">
                {preview.courseName}
                {preview.date ? ` · ${preview.date}` : ""}
              </p>
            )}
            <p className="text-sm text-amber-800 mt-1">
              {unmatched.length === 1
                ? "1 player wasn't recognised — pick who it is, add them as new, or skip."
                : `${unmatched.length} players weren't recognised — match each one below.`}
            </p>
          </div>

          <form action={submitLinkedRoundAction} className="space-y-3">
            <input type="hidden" name="scorecardId" value={scorecardId ?? ""} />
            <input type="hidden" name="udiscUrl" value={udiscUrl} />
            <input type="hidden" name="date" value={preview.date ?? today} />
            <input type="hidden" name="courseName" value={preview.courseName ?? ""} />
            <input type="hidden" name="temperatureC" value={preview.temperatureC ?? ""} />
            <input type="hidden" name="windKph" value={preview.windKph ?? ""} />
            <input type="hidden" name="entriesJson" value={JSON.stringify(preview.entries)} />

            <div className="divide-y divide-forest-100">
              {preview.entries
                .sort((a, b) => a.position - b.position)
                .map((e) => {
                  const matchedPlayer = roster.find((p) => p.id === suggestions.get(e.rawName));
                  return (
                    <div key={e.rawName} className="flex items-center gap-3 py-2">
                      <span className="text-xs text-forest-400 w-6 text-right shrink-0">{e.position}.</span>
                      <span className="text-sm font-medium text-forest-800 w-32 shrink-0 truncate">
                        {e.rawName}
                      </span>
                      {matchedPlayer ? (
                        <span className="text-sm text-forest-600 flex-1">
                          → {matchedPlayer.name}{" "}
                          <span className="text-green-600 font-semibold">✓</span>
                        </span>
                      ) : (
                        <select
                          name={`link_${encodeURIComponent(e.rawName)}`}
                          className="flex-1 border border-amber-400 rounded px-2 py-1 text-sm bg-amber-50"
                          defaultValue=""
                        >
                          <option value="">— Skip this player —</option>
                          <option value="__new__">➕ Add as new player: &quot;{e.rawName}&quot;</option>
                          <optgroup label="Link to existing">
                            {roster.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </optgroup>
                        </select>
                      )}
                    </div>
                  );
                })}
            </div>

            {matchedCount < 2 && (
              <p className="text-xs text-amber-700">
                Link at least {2 - matchedCount} more player{2 - matchedCount !== 1 ? "s" : ""} to save.
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-forest-700 text-white rounded py-2 text-sm font-semibold hover:bg-forest-800"
            >
              Save Round
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
