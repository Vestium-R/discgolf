import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { getRoster, getSettings, isUsingRedis } from "@/lib/store";
import {
  addPlayerAction,
  loginAction,
  logoutAction,
  togglePlayerActiveAction,
  updatePlayerAction,
  updateSeasonAction,
} from "@/app/actions";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const { err } = await searchParams;
  const admin = await isAdmin();

  if (!admin) {
    return (
      <div className="max-w-sm mx-auto mt-8">
        <div className="rounded-2xl border border-forest-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-forest-800">Admin login</h2>
          <p className="text-sm text-forest-600 mb-3">
            Enter the admin password to add rounds or manage the roster.
          </p>
          <form action={loginAction} className="space-y-2">
            <input
              name="password"
              type="password"
              autoFocus
              autoComplete="current-password"
              className="w-full rounded-lg border border-forest-200 px-3 py-2"
              placeholder="Password"
            />
            {err && <p className="text-sm text-red-700">Wrong password.</p>}
            <button
              className="w-full rounded-lg bg-forest-600 px-3 py-2 text-sm font-semibold text-white hover:bg-forest-700"
              type="submit"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    );
  }

  const [roster, settings] = await Promise.all([getRoster(), getSettings()]);
  const usingRedis = isUsingRedis();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-forest-800">Admin</h2>
        <form action={logoutAction}>
          <button className="text-sm text-forest-600 hover:underline">Sign out</button>
        </form>
      </div>

      {!usingRedis && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Using in-memory storage — data will reset on redeploy. Set <code>KV_REST_API_URL</code> and{" "}
          <code>KV_REST_API_TOKEN</code> in Vercel to enable persistent storage.
        </div>
      )}

      <section className="rounded-2xl border border-forest-100 bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-forest-800">Quick actions</h3>
        <div className="mt-2 flex gap-2">
          <Link
            href="/admin/rounds/new"
            className="rounded-lg bg-forest-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-forest-700"
          >
            + Add round
          </Link>
          <Link
            href="/rounds"
            className="rounded-lg border border-forest-300 px-3 py-1.5 text-sm font-semibold text-forest-700 hover:bg-forest-50"
          >
            View rounds
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-forest-100 bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-forest-800">Current season</h3>
        <form action={updateSeasonAction} className="mt-2 flex items-center gap-2">
          <input
            type="number"
            name="currentSeason"
            defaultValue={settings.currentSeason}
            className="w-24 rounded-lg border border-forest-200 px-2 py-1"
          />
          <button className="rounded-lg bg-forest-600 px-3 py-1 text-sm font-semibold text-white hover:bg-forest-700">
            Save
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-forest-100 bg-white p-4 shadow-sm">
        <h3 className="font-semibold text-forest-800">Roster</h3>
        <ul className="mt-2 divide-y divide-forest-100">
          {roster.map((p) => (
            <li key={p.id} className="py-2">
              <form action={updatePlayerAction} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={p.id} />
                <input
                  name="name"
                  defaultValue={p.name}
                  className="flex-1 min-w-[160px] rounded border border-forest-200 px-2 py-1 text-sm"
                />
                <input
                  name="udiscHandle"
                  defaultValue={p.udiscHandle ?? ""}
                  placeholder="UDisc handle"
                  className="flex-1 min-w-[140px] rounded border border-forest-200 px-2 py-1 text-sm"
                />
                <button className="rounded border border-forest-300 px-2 py-1 text-xs text-forest-700 hover:bg-forest-50">
                  Save
                </button>
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
        <form action={addPlayerAction} className="mt-3 flex flex-wrap items-center gap-2 border-t border-forest-100 pt-3">
          <input
            name="name"
            placeholder="New player name"
            className="flex-1 min-w-[160px] rounded border border-forest-200 px-2 py-1 text-sm"
          />
          <input
            name="udiscHandle"
            placeholder="UDisc handle (optional)"
            className="flex-1 min-w-[140px] rounded border border-forest-200 px-2 py-1 text-sm"
          />
          <button className="rounded-lg bg-forest-600 px-3 py-1 text-sm font-semibold text-white hover:bg-forest-700">
            Add player
          </button>
        </form>
      </section>
    </div>
  );
}
