"use client";
import { useState, useTransition } from "react";
import type { BagDisc, DiscType } from "@/lib/types";
import { DISC_TYPE_COLORS, DISC_TYPE_LABELS } from "@/lib/types";
import { removeDiscAction } from "@/app/bag/actions";

type SortKey = "type" | "speed" | "manufacturer" | "stability";

const SORT_LABELS: Record<SortKey, string> = {
  type: "Type",
  speed: "Speed",
  manufacturer: "Brand",
  stability: "Stability",
};

const TYPE_ORDER: DiscType[] = ["distance_driver", "fairway_driver", "midrange", "putter"];

function sortDiscs(discs: BagDisc[], key: SortKey): BagDisc[] {
  return [...discs].sort((a, b) => {
    switch (key) {
      case "type":
        return TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type) || a.speed - b.speed;
      case "speed":
        return b.speed - a.speed;
      case "manufacturer":
        return (a.manufacturer ?? "").localeCompare(b.manufacturer ?? "") || a.discName.localeCompare(b.discName);
      case "stability": {
        const sa = (a.turn ?? 0) + (a.fade ?? 0);
        const sb = (b.turn ?? 0) + (b.fade ?? 0);
        return sb - sa; // most overstable first
      }
    }
  });
}

export function BagList({ discs }: { discs: BagDisc[] }) {
  const [sort, setSort] = useState<SortKey>("type");
  const [pending, startTransition] = useTransition();
  const sorted = sortDiscs(discs, sort);

  function remove(id: string) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      await removeDiscAction(fd);
    });
  }

  return (
    <section className="card overflow-hidden">
      {/* Sort controls */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-forest-100 flex-wrap">
        <span className="text-xs text-forest-500 shrink-0">Sort by</span>
        {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
          <button key={k} onClick={() => setSort(k)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              sort === k ? "bg-forest-700 text-white" : "bg-forest-100 text-forest-600 hover:bg-forest-200"
            }`}>
            {SORT_LABELS[k]}
          </button>
        ))}
        <span className="ml-auto text-xs text-forest-400">{discs.length} discs</span>
      </div>

      {/* Disc rows */}
      <ul className="divide-y divide-forest-50">
        {sorted.map((d) => {
          const stab = (d.turn ?? 0) + (d.fade ?? 0);
          const stabLabel = stab > 1 ? "OS" : stab < -0.5 ? "US" : "Neutral";
          const stabColor = stab > 1 ? "text-red-600 bg-red-50" : stab < -0.5 ? "text-green-700 bg-green-50" : "text-amber-700 bg-amber-50";

          return (
            <li key={d.id} className="flex items-center gap-3 px-4 py-3">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: DISC_TYPE_COLORS[d.type] }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-forest-800">{d.discName}</span>
                  <span className="text-xs text-forest-400">{d.manufacturer}</span>
                  {d.plastic && <span className="text-xs text-forest-400">· {d.plastic}</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-forest-500">{DISC_TYPE_LABELS[d.type]}</span>
                  <span className="text-xs tabular-nums text-forest-600">
                    {d.speed} / {d.glide ?? "—"} / {d.turn ?? "—"} / {d.fade ?? "—"}
                  </span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${stabColor}`}>
                    {stabLabel}
                  </span>
                </div>
              </div>
              <button
                onClick={() => remove(d.id)}
                disabled={pending}
                className="text-xs text-forest-300 hover:text-red-600 px-1 transition-colors shrink-0"
              >
                ✕
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
