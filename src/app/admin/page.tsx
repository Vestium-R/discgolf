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
        <div className="rounded-2xl border border-forest-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-forest-800">Sign in</h2>
          <p className="text-sm text-forest-600 mb-3">
            Enter your email — we&apos;ll send you a one-time sign-in link. No password needed.
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
        <div className="rounded-2xl border border-forest-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-forest-800">Signed in as {user.email}</h2>
          <p className="mt-2 text-sm text-forest-700">
            You&apos;re signed in, but only admins can add rounds or edit the roster. Ask Jeff to add
            your email to the admin list.
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
          <h2 className="text-lg font-semibold text-forest-800">Admin</h2>
          <p className="text-xs text-forest-600">Signed in as {user.email}</p>
        </div>
        <form action={signOutAction}>
          <button className="text-sm text-forest-600 hover:underline">Sign out</button>
        </form>
      </div>

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
