import Link from "next/link";
import { getUser, isAdminEmail } from "@/lib/auth";
import { getRoster, getSettings } from "@/lib/store";
import {
  addPlayerAction,
  signOutAction,
  togglePlayerActiveAction,
  updatePlayerAction,
  updateSeasonAction,
} from "@/app/actions";
import { SignInForm } from "@/components/SignInForm";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const { err } = await searchParams;
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
            You&apos;re signed in, but admin actions (edit roster, change season, delete rounds) are limited.
            Ask Jeff to add your email to the admin list.
          </p>
          <form action={signOutAction} className="mt-3">
            <button className="text-sm text-forest-600 hover:underline">Sign out</button>
          </form>
        </div>
      </div>
    );
  }

  const [roster, settings] = await Promise.all([getRoster(), getSettings()]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-forest-800">Admin</h2>
          <p className="text-xs text-forest-600">Signed in as {user.email}</p>
        </div>
        <form action={signOutAction}>
          <button className="text-sm text-forest-600 hover:underline">Sign out</button>
        </form>
      </div>

      <section className="card p-4">
        <h3 className="font-display font-bold text-forest-800">Current season</h3>
        <form action={updateSeasonAction} className="mt-2 flex items-center gap-2">
          <input
            type="number"
            name="currentSeason"
            defaultValue={settings.currentSeason}
            className="w-24 input-pill"
          />
          <button className="btn-primary">Save</button>
        </form>
        <p className="mt-2 text-xs text-forest-600">
          The season where new rounds land by default.
        </p>
      </section>

      <section className="card p-4">
        <h3 className="font-display font-bold text-forest-800">Roster</h3>
        <p className="text-xs text-forest-600 mb-3">
          Add each friend&apos;s UDisc handle (from the scorecard; e.g. <code>jeffreyr</code>) so the parser
          auto-matches them when anyone pastes a round.
        </p>
        <ul className="divide-y divide-forest-100">
          {roster.map((p) => (
            <li key={p.id} className="py-2">
              <form action={updatePlayerAction} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={p.id} />
                <input
                  name="name"
                  defaultValue={p.name}
                  className="flex-1 min-w-[160px] input-pill"
                />
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
          <input
            name="name"
            placeholder="New player name"
            className="flex-1 min-w-[160px] input-pill"
          />
          <input
            name="udiscHandle"
            placeholder="UDisc handle (optional)"
            className="flex-1 min-w-[140px] input-pill"
          />
          <button className="btn-primary">Add player</button>
        </form>
      </section>

      <section className="card p-4">
        <h3 className="font-display font-bold text-forest-800">Quick links</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link href="/rounds" className="btn-secondary">View all rounds</Link>
          <Link href="/add" className="btn-secondary">Add round (public)</Link>
          <Link href="/diagnose" className="btn-secondary">Diagnostics</Link>
        </div>
      </section>
    </div>
  );
}
