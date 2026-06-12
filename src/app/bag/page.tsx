import { getUser } from "@/lib/auth";
import { getBagDiscs, getPlayerByAuthEmail, getUserPrefs, getDiscThrowStats } from "@/lib/store";
import { SignInForm } from "@/components/SignInForm";
import { AddDiscForm } from "@/components/AddDiscForm";
import { BagList } from "@/components/BagList";
import { BagInteractive } from "@/components/BagInteractive";
import { PlayerProfile } from "@/components/PlayerProfile";
import { WhatToThrow } from "@/components/WhatToThrow";
import { CoursePlayPlanner } from "@/components/CoursePlayPlanner";
import { DiscRecommender } from "@/components/DiscRecommender";
import { ShareBag } from "@/components/ShareBag";
import { MeasureThrowGPS } from "@/components/MeasureThrowGPS";
import { BagAnalysis } from "@/components/BagAnalysis";
import type { BagDisc, DiscType } from "@/lib/types";

export const dynamic = "force-dynamic";

function analyzeBag(discs: BagDisc[]): string[] {
  if (discs.length === 0) return [];
  const gaps: string[] = [];
  const byType = (t: DiscType) => discs.filter((d) => d.type === t);
  const putters  = byType("putter");
  const mids     = byType("midrange");
  const fairways = byType("fairway_driver");
  const distance = byType("distance_driver");

  if (putters.length === 0)  gaps.push("No putter — essential for close-range and basket shots.");
  if (mids.length === 0)     gaps.push("No midrange — great for control and wooded courses.");
  if (fairways.length === 0 && distance.length === 0) gaps.push("No driver — add a fairway driver to start.");

  const drivers = [...fairways, ...distance];
  if (drivers.length >= 2) {
    const stabs = drivers.map((d) => (d.turn ?? 0) + (d.fade ?? 0));
    if (!stabs.some((s) => s < -0.5))       gaps.push("All drivers are overstable or neutral — add an understable driver for max distance and flex shots.");
    if (!stabs.some((s) => s > 1))          gaps.push("No overstable driver — important for headwind and controlled fade shots.");
    if (!stabs.some((s) => s >= -0.5 && s <= 1)) gaps.push("No neutral driver — a straight flyer gives you more lines.");
  }
  if (fairways.length === 0 && distance.length > 0) gaps.push("No fairway driver — easier to control on tight holes.");
  if (putters.length >= 1 && mids.length === 0 && drivers.length >= 1) gaps.push("Gap between putter and driver — a midrange fills the approach range.");

  return gaps;
}

export default async function BagPage() {
  const user = await getUser();

  if (!user) {
    return (
      <div className="space-y-6 max-w-sm mx-auto pt-6">
        <header>
          <h2 className="font-display text-2xl font-bold text-forest-800">My Bag</h2>
          <p className="text-sm text-forest-600 mt-1">Sign in to track your discs, spot bag gaps, and get AI recommendations.</p>
        </header>
        <div className="card p-5">
          <p className="text-sm font-semibold text-forest-800 mb-3">Sign in with your email</p>
          <SignInForm redirectAfter="/bag" />
        </div>
      </div>
    );
  }

  const player = await getPlayerByAuthEmail(user.email);
  if (!player) {
    return (
      <div className="space-y-6 max-w-sm mx-auto pt-6">
        <header>
          <h2 className="font-display text-2xl font-bold text-forest-800">My Bag</h2>
        </header>
        <div className="card p-5">
          <p className="text-sm text-forest-700 mb-3">No player profile found for {user.email}.</p>
          <p className="text-sm text-forest-600">Ask an admin to add you to the roster.</p>
        </div>
      </div>
    );
  }

  const [discs, userPrefs, throwStats] = await Promise.all([getBagDiscs(user.id), getUserPrefs(user.id), getDiscThrowStats(user.id)]);
  const gaps = analyzeBag(discs);

  return (
    <div className="space-y-8">
      {/* ━━━━━ SETUP ZONE ━━━━━ */}
      <header>
        <h2 className="font-display text-2xl font-bold text-forest-800">My Bag</h2>
        <p className="text-sm text-forest-600">{discs.length} disc{discs.length !== 1 ? "s" : ""} · {user.email}</p>
      </header>

      <PlayerProfile initial={userPrefs} />

      <AddDiscForm />

      {/* ━━━━━ MAIN BAG VIEW ━━━━━ */}
      <div className="space-y-4">
        {discs.filter(d => !d.inStorage).length > 0 && (
          <BagList
            discs={discs.filter(d => !d.inStorage)}
            title={`In Bag (${discs.filter(d => !d.inStorage).length})`}
            showStorage
            gaps={gaps}
            throwStats={throwStats}
          />
        )}

        {discs.filter(d => d.inStorage).length > 0 && (
          <BagList
            discs={discs.filter(d => d.inStorage)}
            showStorage
            isStorage
            throwStats={throwStats}
          />
        )}
      </div>

      {/* ━━━━━ ON-COURSE TOOLS ━━━━━ */}
      {discs.filter(d => !d.inStorage).length >= 1 && (
        <div className="border-t-2 border-forest-100 pt-6 space-y-4">
          <h3 className="text-xs font-semibold text-forest-600 uppercase tracking-widest">On-Course Tools</h3>

          <MeasureThrowGPS discs={discs} />

          {discs.filter(d => !d.inStorage).length >= 2 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <WhatToThrow discs={discs} serverPrefs={userPrefs} />
              <CoursePlayPlanner serverPrefs={userPrefs} />
            </div>
          )}

          {discs.filter(d => !d.inStorage).length > 0 && (
            <ShareBag discs={discs} />
          )}
        </div>
      )}

      {/* ━━━━━ ANALYSIS & LEARNING ━━━━━ */}
      {discs.length > 0 && (
        <div className="border-t-2 border-forest-100 pt-6 space-y-4">
          <h3 className="text-xs font-semibold text-forest-600 uppercase tracking-widest">Analysis & Learning</h3>

          <BagAnalysis discs={discs.filter(d => !d.inStorage)} storageDiscs={discs.filter(d => d.inStorage)} serverPrefs={userPrefs} />

          <DiscRecommender />

          {discs.filter(d => !d.inStorage).length >= 2 && (
            <BagInteractive discs={discs.filter(d => !d.inStorage)} serverPrefs={userPrefs} />
          )}
        </div>
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
