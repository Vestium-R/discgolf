import Link from "next/link";
import { getUser, isAdminEmail } from "@/lib/auth";
import { getHistory, getRoster, getSettings } from "@/lib/store";
import {
  addPlayerAction,
  autoInactivateAction,
  backfillAllRoundsAction,
  signOutAction,
  togglePlayerActiveAction,
  updatePlayerAction,
  updateSeasonAction,
  updateSeasonConfigAction,
} from "@/app/actions";
import { SignInForm } from "@/components/SignInForm";
import { BadgeCrown } from "@/components/BadgeCrown";
import { AuditPage } from "@/app/admin/audit-page";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string; ok?: string }>;
}) {
  const { err, ok } = await searchParams;
  const user = await getUser();

  if (!user) {
    return (
      <div className="max-w-sm mx-auto mt-8">
        <div className="card p-5">
          <h2 className="font-display text-lg font-bold text-forest-800">Admin sign-in</h2>
          <p className="text-sm text-forest-600 mb-3">
            Rounds can be added without signing in — this is just for roster and season changes.
          </p>
          <SignInForm />
          {err === "callback" && (
            <p className="mt-2 text-sm text-red-700">That sign-in link expired. Try again.</p>
          )}
        </div>
      </div>
    );
  }

  const admin = isAdminEmail(user.email);
  if (!admin) {
    return (
      <div className="max-w-md mx-auto mt-8 space-y-3">
        <div className="card p-5">
          <h2 className="font-display text-lg font-bold text-forest-800">Signed in as {user.email}</h2>
          <p className="mt-2 text-sm text-forest-700">
            You&apos;re signed in, but admin actions are limited. Ask Jeff to add your email to the admin list.
          </p>
          <form action={signOutAction} className="mt-3">
            <button className="text-sm text-forest-600 hover:underline">Sign out</button>
          </form>
        </div>
      </div>
    );
  }

  const [roster, settings, history] = await Promise.all([getRoster(), getSettings(), getHistory()]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-forest-800">Admin</h2>
          <p className="text-xs text-forest-600">Signed in as {user.email}</p>
        </div>
        <form action={signOutAction}>
          <button className="text-sm text-forest-600 hover:underline">Sign out</button>
        </form>
      </div>

      {ok && (
        <div className="card bg-forest-50 border-forest-200 p-3 text-sm text-forest-800">
          Saved.
        </div>
      )}
      {err && err !== "callback" && (
        <div className="card bg-red-50 border-red-200 p-3 text-sm text-red-900 whitespace-pre-wrap">
          {decodeURIComponent(err)}
        </div>
      )}

      <details className="card p-0" open>
        <summary className="cursor-pointer p-4 font-display font-bold text-forest-800 hover:bg-forest-50 select-none">
          ▼ Current season
        </summary>
        <div className="p-4 border-t border-forest-100 space-y-2">
          <form action={updateSeasonAction} className="flex items-center gap-2">
            <input type="number" name="currentSeason" defaultValue={settings.currentSeason} className="w-24 input-pill" />
            <button className="btn-primary">Save</button>
          </form>
          <p className="text-xs text-forest-600">The season that new rounds land in by default.</p>
        </div>
      </details>

      <details className="card p-0">
        <summary className="cursor-pointer p-4 font-display font-bold text-forest-800 hover:bg-forest-50 select-none">
          ▼ Season configs
        </summary>
        <div className="p-4 border-t border-forest-100 space-y-4">
          <p className="text-xs text-forest-600">
            Who starts the season with the badge, what badge image to show, and the past champion.
          </p>
        <ul className="space-y-4 divide-y divide-forest-100">
          {history.map((h) => {
            const initial = h.initialBadgeHolderPlayerId ? roster.find((p) => p.id === h.initialBadgeHolderPlayerId) : null;
            return (
              <li key={h.season} className="pt-4 first:pt-0">
                <form action={updateSeasonConfigAction} className="space-y-2">
                  <input type="hidden" name="season" value={h.season} />
                  <div className="flex items-center gap-3">
                    <BadgeCrown size="md" imageUrl={h.badgeImageUrl} />
                    <div className="flex-1">
                      <div className="font-display text-lg font-bold text-forest-800">Season {h.season}</div>
                      <div className="text-xs text-forest-600">
                        {initial ? `Starts with: ${initial.name}` : "No starting holder set"}
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="text-xs">
                      <span className="block text-forest-700 mb-1">Initial badge holder</span>
                      <select
                        name="initialBadgeHolderPlayerId"
                        defaultValue={h.initialBadgeHolderPlayerId ?? ""}
                        className="input-pill"
                      >
                        <option value="">— none —</option>
                        {roster.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs">
                      <span className="block text-forest-700 mb-1">Champion (past seasons)</span>
                      <select
                        name="championPlayerId"
                        defaultValue={h.championPlayerId ?? ""}
                        className="input-pill"
                      >
                        <option value="">— none —</option>
                        {roster.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs sm:col-span-2">
                      <span className="block text-forest-700 mb-1">Badge image URL</span>
                      <input
                        name="badgeImageUrl"
                        defaultValue={h.badgeImageUrl ?? ""}
                        placeholder="https://…"
                        className="input-pill"
                      />
                    </label>
                    <label className="text-xs sm:col-span-2">
                      <span className="block text-forest-700 mb-1">Note</span>
                      <input
                        name="note"
                        defaultValue={h.note ?? ""}
                        placeholder="e.g. No stats recorded"
                        className="input-pill"
                      />
                    </label>
                    <input type="hidden" name="championName" value={h.championName ?? ""} />
                  </div>
                  <button className="btn-secondary">Save season {h.season}</button>
                </form>
              </li>
            );
          })}
        </ul>
        <form action={updateSeasonConfigAction} className="mt-4 border-t border-forest-100 pt-4 space-y-2">
          <h4 className="text-sm font-semibold text-forest-800">Add/update a season</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs">
              <span className="block text-forest-700 mb-1">Year</span>
              <input type="number" name="season" required className="input-pill" placeholder="2027" />
            </label>
            <label className="text-xs">
              <span className="block text-forest-700 mb-1">Initial badge holder</span>
              <select name="initialBadgeHolderPlayerId" className="input-pill">
                <option value="">— none —</option>
                {roster.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
            <label className="text-xs sm:col-span-2">
              <span className="block text-forest-700 mb-1">Badge image URL</span>
              <input name="badgeImageUrl" className="input-pill" placeholder="https://…" />
            </label>
          </div>
          <button className="btn-primary">Add season</button>
        </form>
        </div>
      </details>

      <details className="card p-0">
        <summary className="cursor-pointer p-4 font-display font-bold text-forest-800 hover:bg-forest-50 select-none">
          ▼ Roster
        </summary>
        <div className="p-4 border-t border-forest-100 space-y-3">
        <p className="text-xs text-forest-600 mb-2">
          UDisc handles (from the scorecard, e.g. <code>jeffreyr</code>) let the parser auto-match.
          Active players show in standings; inactive players are hidden until they appear in a new
          UDisc round (which auto-activates them).
        </p>
        {ok?.startsWith("inactivated") && (
          <p className="mb-2 text-sm text-forest-800">✓ Marked {ok.replace("inactivated:", "")} player(s) inactive.</p>
        )}
        <form action={autoInactivateAction} className="mb-3">
          <button className="btn-secondary text-sm">Mark inactive: no rounds this season</button>
        </form>
        <ul className="divide-y divide-forest-100">
          {roster.map((p) => (
            <li key={p.id} className="py-2">
              <form action={updatePlayerAction} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={p.id} />
                <input name="name" defaultValue={p.name} className="flex-1 min-w-[160px] input-pill" />
                <input
                  name="udiscHandle"
                  defaultValue={p.udiscHandle ?? ""}
                  placeholder="UDisc handle"
                  className="flex-1 min-w-[140px] input-pill"
                />
                <button className="btn-secondary">Save</button>
              </form>
              <form action={togglePlayerActiveAction} className="mt-1">
                <input type="hidden" name="id" value={p.id} />
                <button
                  type="submit"
                  className={`text-xs ${p.active ? "text-forest-600" : "text-forest-400"} hover:underline`}
                >
                  {p.active ? "Active" : "Inactive"} — toggle
                </button>
              </form>
            </li>
          ))}
        </ul>
        <form action={addPlayerAction} className="mt-4 flex flex-wrap items-center gap-2 border-t border-forest-100 pt-3">
          <input name="name" placeholder="New player name" className="flex-1 min-w-[160px] input-pill" />
          <input name="udiscHandle" placeholder="UDisc handle (optional)" className="flex-1 min-w-[140px] input-pill" />
          <button className="btn-primary">Add player</button>
        </form>
        </div>
      </details>

      <details className="card p-0">
        <summary className="cursor-pointer p-4 font-display font-bold text-forest-800 hover:bg-forest-50 select-none">
          ▼ Backfill rounds
        </summary>
        <div className="p-4 border-t border-forest-100 space-y-3">
        <p className="mt-1 text-sm text-forest-600">
          Re-parse every round that has a UDisc link to pull per-player scores and weather.
          Positions aren&apos;t changed. Safe to run repeatedly.
        </p>
        {ok?.startsWith("backfill") && (
          <p className="mt-2 text-sm text-forest-800">✓ {ok.replace("backfill:", "").replace(/,/g, " · ")}</p>
        )}
        <form action={backfillAllRoundsAction}>
          <button className="btn-primary">Backfill all UDisc rounds</button>
        </form>
        </div>
      </details>

      <details className="card p-0">
        <summary className="cursor-pointer p-4 font-display font-bold text-forest-800 hover:bg-forest-50 select-none">
          ▼ Disc Database Audit
        </summary>
        <div className="p-4 border-t border-forest-100">
          <AuditPage />
        </div>
      </details>

      <details className="card p-0">
        <summary className="cursor-pointer p-4 font-display font-bold text-forest-800 hover:bg-forest-50 select-none">
          ▼ Links
        </summary>
        <div className="p-4 border-t border-forest-100">
        <div className="flex flex-wrap gap-2">
          <Link href="/rounds" className="btn-secondary">All rounds</Link>
          <Link href="/add" className="btn-secondary">Add round (public)</Link>
          <Link href="/rules" className="btn-secondary">Rules</Link>
          <Link href="/diagnose" className="btn-secondary">Diagnostics</Link>
        </div>
        </div>
      </details>
    </div>
  );
}
