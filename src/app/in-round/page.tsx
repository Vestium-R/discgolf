import { getUser } from "@/lib/auth";
import { getBagDiscs, getPlayerByAuthEmail, getUserPrefs, getUserThrows } from "@/lib/store";
import { SignInForm } from "@/components/SignInForm";
import { InRoundClient } from "@/components/InRoundClient";

export const dynamic = "force-dynamic";

export default async function InRoundPage() {
  const user = await getUser();

  if (!user) {
    return (
      <div className="space-y-6 max-w-sm mx-auto pt-6">
        <header>
          <h2 className="font-display text-2xl font-bold text-forest-800">In Round</h2>
          <p className="text-sm text-forest-600 mt-1">Sign in to get shot recommendations and measure your throws.</p>
        </header>
        <div className="card p-5">
          <p className="text-sm font-semibold text-forest-800 mb-3">Sign in with your email</p>
          <SignInForm redirectAfter="/in-round" />
        </div>
      </div>
    );
  }

  const player = await getPlayerByAuthEmail(user.email);
  if (!player) {
    return (
      <div className="space-y-6 max-w-sm mx-auto pt-6">
        <header>
          <h2 className="font-display text-2xl font-bold text-forest-800">In Round</h2>
        </header>
        <div className="card p-5">
          <p className="text-sm text-forest-700 mb-3">No player profile found for {user.email}.</p>
          <p className="text-sm text-forest-600">Ask an admin to add you to the roster.</p>
        </div>
      </div>
    );
  }

  const [discs, userPrefs, throws] = await Promise.all([
    getBagDiscs(user.id),
    getUserPrefs(user.id),
    getUserThrows(user.id),
  ]);

  return <InRoundClient discs={discs} userPrefs={userPrefs} throws={throws} userId={user.id} />;
}
