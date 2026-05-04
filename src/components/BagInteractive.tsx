"use client";
import { useState, useEffect } from "react";
import type { BagDisc } from "@/lib/types";
import type { UserPrefs } from "@/lib/store";
import { BagChart } from "@/components/BagChart";
import { BagSettings, loadPrefs, type BagPrefs } from "@/components/BagSettings";

// Merge server prefs into BagPrefs format
function serverToBagPrefs(server: UserPrefs): Partial<BagPrefs> {
  return {
    throwStyle: server.throwStyle as BagPrefs["throwStyle"],
    maxDist: server.maxDistFt,
  };
}

export function BagInteractive({ discs, serverPrefs }: { discs: BagDisc[]; serverPrefs?: UserPrefs }) {
  const [prefs, setPrefs] = useState<BagPrefs>(() => {
    // Start with localStorage, override with server values if available
    const local = loadPrefs();
    return serverPrefs ? { ...local, ...serverToBagPrefs(serverPrefs) } : local;
  });

  useEffect(() => {
    if (serverPrefs) {
      setPrefs(p => ({ ...p, ...serverToBagPrefs(serverPrefs) }));
    }
  }, [serverPrefs]);

  return (
    <section className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-forest-800">Bag chart</h3>
        <BagSettings onChange={setPrefs} />
      </div>
      <BagChart discs={discs} prefs={prefs} />
    </section>
  );
}
