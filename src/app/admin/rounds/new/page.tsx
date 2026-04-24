import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getRoster, getSettings } from "@/lib/store";
import { parseUdiscUrl, matchPlayer } from "@/lib/udisc";
import { previewUdiscAction, submitRoundAction } from "@/app/actions";

type Params = {
  udiscUrl?: string;
  err?: string;
};

export default async function NewRoundPage({ searchParams }: { searchParams: Promise<Params> }) {
  if (!(await isAdmin())) redirect("/admin");
  const params = await searchParams;
  const [roster, settings] = await Promise.all([getRoster(), getSettings()]);

  let preview: Awaited<ReturnType<typeof parseUdiscUrl>> | null = null;
  let suggestions: Map<string, string | null> | null = null;
  if (params.udiscUrl) {
    preview = await parseUdiscUrl(params.udiscUrl);
    if (preview.ok) {
      suggestions = new Map(
        preview.entries.map((e) => [e.rawName, matchPlayer(e.rawName, roster)?.id ?? null])
      );
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const defaultPositions: Record<string, number | ""> = {};
  if (preview?.ok) {
    for (const e of preview.entries) {
      const pid = suggestions?.get(e.rawName);
      if (pid) defaultPositions[pid] = e.position;
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-forest-800">Add round</h2>

      {params.err === "toofew" && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          Need at least two players with positions.
        </div>
      )}

      <section className="rounded-2xl border border-forest-100 bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-forest-800">Import from UDisc</h3>
        <p className="text-sm text-forest-600">
          Paste a public UDisc round or leaderboard URL — we&apos;ll try to parse it.
        </p>
        <form action={previewUdiscAction} className="mt-2 flex gap-2">
          <input
            name="udiscUrl"
            type="url"
            defaultValue={params.udiscUrl ?? ""}
            placeholder="https://udisc.com/..."
            className="flex-1 rounded-lg border border-forest-200 px-3 py-2 text-sm"
          />
          <button className="rounded-lg bg-forest-600 px-3 py-2 text-sm font-semibold text-white hover:bg-forest-700">
            Preview
          </button>
        </form>
        {preview && !preview.ok && (
          <p className="mt-2 text-sm text-red-700">
            {preview.warning ?? "Could not parse page."} You can still fill in positions below.
          </p>
        )}
        {preview?.ok && (
          <div className="mt-3 space-y-1 text-sm">
            <p className="text-forest-700">
              Parsed {preview.entries.length} entries{preview.courseName ? ` at ${preview.courseName}` : ""}.
            </p>
            <ul className="text-forest-700">
              {preview.entries.map((e) => {
                const matched = suggestions?.get(e.rawName);
                const p = matched ? roster.find((x) => x.id === matched) : null;
                return (
                  <li key={`${e.position}-${e.rawName}`}>
                    #{e.position} {e.rawName}
                    {p ? (
                      <span className="text-forest-500"> → {p.name}</span>
                    ) : (
                      <span className="text-amber-700"> → no match, assign below</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      <form action={submitRoundAction} className="space-y-4">
        <section className="rounded-2xl border border-forest-100 bg-white p-4 shadow-sm space-y-2">
          <div className="flex flex-wrap gap-3">
            <label className="flex-1 min-w-[120px] text-sm">
              <span className="block text-forest-700 mb-1">Date</span>
              <input
                name="date"
                type="date"
                defaultValue={today}
                required
                className="w-full rounded-lg border border-forest-200 px-2 py-1.5"
              />
            </label>
            <label className="flex-1 min-w-[120px] text-sm">
              <span className="block text-forest-700 mb-1">Season</span>
              <input
                name="season"
                type="number"
                defaultValue={settings.currentSeason}
                required
                className="w-full rounded-lg border border-forest-200 px-2 py-1.5"
              />
            </label>
            <label className="flex-1 min-w-[160px] text-sm">
              <span className="block text-forest-700 mb-1">Course</span>
              <input
                name="courseName"
                defaultValue={preview?.ok ? preview.courseName ?? "" : ""}
                className="w-full rounded-lg border border-forest-200 px-2 py-1.5"
                placeholder="Optional"
              />
            </label>
          </div>
          <input type="hidden" name="udiscUrl" value={params.udiscUrl ?? ""} />
          <input type="hidden" name="source" value={params.udiscUrl ? "udisc" : "manual"} />
          <label className="block text-sm">
            <span className="block text-forest-700 mb-1">Note (optional)</span>
            <input
              name="note"
              className="w-full rounded-lg border border-forest-200 px-2 py-1.5"
              placeholder="Rain shortened to 9 holes, etc."
            />
          </label>
        </section>

        <section className="rounded-2xl border border-forest-100 bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-forest-800">Positions</h3>
          <p className="text-sm text-forest-600 mb-2">
            Enter finishing position for every player who played. Leave blank for non-players. Ties: use the same number.
          </p>
          <ul className="divide-y divide-forest-100">
            {roster.map((p) => (
              <li key={p.id} className="py-2 flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-sm font-medium text-forest-800">{p.name}</div>
                  {p.udiscHandle && <div className="text-xs text-forest-500">{p.udiscHandle}</div>}
                </div>
                <input
                  name={`pos_${p.id}`}
                  type="number"
                  min={1}
                  step={1}
                  defaultValue={defaultPositions[p.id] ?? ""}
                  className="w-20 rounded border border-forest-200 px-2 py-1 text-sm"
                  placeholder="—"
                />
              </li>
            ))}
          </ul>
        </section>

        <button
          type="submit"
          className="rounded-lg bg-forest-600 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-700"
        >
          Save round
        </button>
      </form>
    </div>
  );
}
