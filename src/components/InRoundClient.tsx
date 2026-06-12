"use client";
import Link from "next/link";
import type { BagDisc } from "@/lib/types";
import type { UserPrefs, DiscThrow } from "@/lib/store";
import { asAuthUserId } from "@/lib/id-validation";
import { WhatToThrow } from "@/components/WhatToThrow";
import { BagList } from "@/components/BagList";
import { MeasureThrowGPS } from "@/components/MeasureThrowGPS";
import { ThrowsClient } from "@/components/ThrowsClient";

export function InRoundClient({
  discs,
  userPrefs,
  throws,
  userId,
}: {
  discs: BagDisc[];
  userPrefs: UserPrefs | null;
  throws?: DiscThrow[];
  userId?: string;
}) {
  const bagDiscs = discs.filter((d) => !d.inStorage);

  // Empty bag guard
  if (discs.length === 0) {
    return (
      <div className="card p-8 text-center text-forest-500 mt-6">
        <p className="text-4xl mb-3">🎒</p>
        <p className="font-semibold">Your bag is empty</p>
        <p className="text-sm mt-1">
          Add discs in{" "}
          <a href="/bag" className="underline text-forest-700 hover:text-forest-800">
            My Bag
          </a>{" "}
          before heading out.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Compact page header */}
      <header className="mb-4">
        <h2 className="font-display text-xl font-bold text-forest-800">In Round</h2>
        <p className="text-xs text-forest-500">
          {bagDiscs.length} disc{bagDiscs.length !== 1 ? "s" : ""} in bag
        </p>
      </header>

      {/* Main content — vertical on mobile, 2-col on desktop */}
      {/* pb-32 on mobile: clears sticky measure bar (56px) + bottom nav (56px) + gap */}
      <div className="grid gap-6 sm:grid-cols-2 pb-32 sm:pb-8">
        {/* Recommendations */}
        <div>
          <WhatToThrow
            discs={discs}
            serverPrefs={userPrefs ?? undefined}
            defaultOpen={true}
          />
        </div>

        {/* Bag quick-view */}
        <div>
          {bagDiscs.length > 0 ? (
            <BagList
              discs={bagDiscs}
              title={`Bag (${bagDiscs.length})`}
            />
          ) : (
            <div className="card p-6 text-center text-forest-400 text-sm">
              <p>All discs are in storage.</p>
              <a href="/bag" className="text-forest-700 underline text-xs mt-1 block hover:text-forest-800">
                Manage bag
              </a>
            </div>
          )}
        </div>
      </div>

      {/* My Throws section */}
      {throws && throws.length > 0 && userId && (
        <section className="space-y-4 mt-6 pt-6 border-t border-forest-100">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-forest-800">📏 My Throws</h3>
            <Link href="/my-throws" className="text-xs text-forest-600 hover:text-forest-800 hover:underline">View all</Link>
          </div>
          <ThrowsClient initialThrows={throws} userId={asAuthUserId(userId)} />
        </section>
      )}

      {/* Sticky "Measure throw" — sits above BottomNav on mobile */}
      <div className="fixed bottom-14 inset-x-0 z-40 px-4 pb-2 sm:hidden">
        <MeasureThrowGPS discs={discs} />
      </div>

      {/* Desktop: inline measure button below grid */}
      <div className="hidden sm:block">
        <MeasureThrowGPS discs={discs} />
      </div>
    </div>
  );
}
