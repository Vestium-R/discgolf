import { getUser } from "@/lib/auth";
import { getBagDiscs } from "@/lib/store";
import { SignInForm } from "@/components/SignInForm";
import { BagChart } from "@/components/BagChart";
import { AddDiscForm } from "@/components/AddDiscForm";
import { BagList } from "@/components/BagList";
import type { BagDisc, DiscType } from "@/lib/types";

export const dynamic = "force-dynamic";

function analyzeBag(discs: BagDisc[]): string[] {
  if (discs.length === 0) return [];
  const gaps: string[] = [];
  const byType = (t: DiscType) => discs.filter((d) => d.type === t);
  const putters = byType("putter");
  const mids = byType("midrange");
  const fairways = byType("fairway_driver");
  const distance = byType("distance_driver");

  if (putters.length === 0) gaps.push("No putter — essential for close-range and basket shots.");
  if (mids.length === 0) gaps.push("No midrange — great for control and wooded courses.");
  if (fairways.length === 0 && distance.length === 0) gaps.push("No driver — add a fairway driver to start.");

  const drivers = [...fairways, ...distance];
  if (drivers.length >= 2) {
    const stabs = drivers.map((d) => (d.turn ?? 0) + (d.fade ?? 0));
    if (!stabs.some((s) => s < -0.5)) gaps.push("All drivers are overstable or neutral — an understable driver adds distance and flex shots.");
    if (!stabs.some((s) => s > 1)) gaps.push("No overstable driver — useful for headwind shots and reliable fades.");
    if (!stabs.some((s) => s >= -0.5 && s <= 1)) gaps.push("No neutral driver — a straight flyer helps with controlled distance shots.");
  }
  if (fairways.length === 0 && distance.length > 0) gaps.push("No fairway driver — easier to control on tight holes.");
  if (putters.length >= 1 && mids.length === 0 && drivers.length >= 1) gaps.push("Gap between putter and driver — a midrange fills the range nicely.");

  return gaps;
}

export default async function BagPage() {
  const user = await getUser();

  if (!user) {
    return (
      <div className="space-y-6 max-w-sm mx-auto pt-6">
        <header>
          <h2 className="font-display text-2xl font-bold text-forest-800">My Bag</h2>
          <p className="text-sm text-forest-600 mt-1">Sign in to track your discs and spot gaps in your bag.</p>
        </header>
        <div className="card p-5">
          <p className="text-sm font-semibold text-forest-800 mb-3">Sign in with your email</p>
          <SignInForm redirectAfter="/bag" />
        </div>
      </div>
    );
  }

  const discs = await getBagDiscs(user.id);
  const gaps = analyzeBag(discs);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-2xl font-bold text-forest-800">My Bag</h2>
        <p className="text-sm text-forest-600">{discs.length} disc{discs.length !== 1 ? "s" : ""} · {user.email}</p>
      </header>

      <section className="card p-5 space-y-4">
        <h3 className="font-display font-bold text-forest-800">Add a disc</h3>
        <AddDiscForm />
      </section>

      {discs.length > 0 && <BagList discs={discs} />}

      {discs.length >= 2 && (
        <section className="card p-4 space-y-3">
          <h3 className="font-display font-bold text-forest-800">Bag chart</h3>
          <BagChart discs={discs} />
        </section>
      )}

      {gaps.length > 0 && (
        <section className="card p-4 space-y-3">
          <h3 className="font-display font-bold text-forest-800">Bag gaps</h3>
          <ul className="space-y-2">
            {gaps.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-forest-700">
                <span className="mt-0.5 shrink-0 text-amber-500">⚠</span>
                {g}
              </li>
            ))}
          </ul>
        </section>
      )}

      {discs.length === 0 && (
        <div className="card p-8 text-center text-forest-500">
          <p className="text-4xl mb-3">🎯</p>
          <p className="font-semibold">Your bag is empty</p>
          <p className="text-sm mt-1">Search for a disc above to get started.</p>
        </div>
      )}
    </div>
  );
}
