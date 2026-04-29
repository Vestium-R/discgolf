"use client";
import { useState } from "react";
import type { BagDisc } from "@/lib/types";
import { DISC_TYPE_LABELS, DISC_TYPE_COLORS } from "@/lib/types";

type Wind = "none" | "headwind" | "tailwind" | "crosswind";

const WIND_LABELS: Record<Wind, string> = {
  none: "No wind",
  headwind: "Headwind 💨→",
  tailwind: "Tailwind →💨",
  crosswind: "Crosswind",
};

function speedToFeet(speed: number) {
  return Math.round(100 + (speed - 1) * (320 / 13));
}

function recommend(discs: BagDisc[], distFt: number, wind: Wind): { disc: BagDisc; reason: string }[] {
  const bag = discs.filter((d) => !d.inStorage);
  if (bag.length === 0) return [];

  // Target speed based on distance
  // Rough guide: speed 1–3 = 100–175ft, 4–6 = 175–250ft, 7–9 = 250–330ft, 10–14 = 330ft+
  const idealSpeed = Math.max(1, Math.min(14, 1 + ((distFt - 100) / 320) * 13));

  const stab = (d: BagDisc) => (d.turn ?? 0) + (d.fade ?? 0);

  // Adjust stability target based on wind
  // Headwind: want more overstable (higher stab) to fight the turn
  // Tailwind: can use more understable (lower stab)
  let stabMin = -3, stabMax = 4;
  if (wind === "headwind") { stabMin = 0; stabMax = 5; }
  if (wind === "tailwind") { stabMin = -4; stabMax = 1; }

  const scored = bag
    .filter((d) => {
      const s = stab(d);
      return s >= stabMin && s <= stabMax;
    })
    .map((d) => {
      const discFeet = speedToFeet(d.speed);
      const speedDelta = Math.abs(d.speed - idealSpeed);
      const distDelta = Math.abs(discFeet - distFt);
      const score = speedDelta * 10 + distDelta * 0.1;
      return { disc: d, score, discFeet };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return scored.map(({ disc, discFeet }) => {
    const s = stab(disc);
    const stabDesc = s > 1.5 ? "overstable" : s < -0.5 ? "understable" : "neutral";
    const windNote =
      wind === "headwind" ? "holds up into the wind" :
      wind === "tailwind"  ? "use with the wind boost" :
      wind === "crosswind" ? "aim for the crosswind to push it on line" : "";
    const distNote = discFeet > distFt + 30 ? "throw at 70–80% power" :
                     discFeet < distFt - 30 ? "full send needed" : "";
    const parts = [`${stabDesc} for this distance`];
    if (windNote) parts.push(windNote);
    if (distNote) parts.push(distNote);
    return { disc, reason: parts.join(" · ") };
  });
}

export function WhatToThrow({ discs }: { discs: BagDisc[] }) {
  const [dist, setDist] = useState(200);
  const [wind, setWind] = useState<Wind>("none");
  const [show, setShow] = useState(false);

  const recs = recommend(discs, dist, wind);

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="btn-secondary w-full text-sm">
        🎯 What should I throw?
      </button>
    );
  }

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-forest-800">What to throw</h3>
        <button onClick={() => setShow(false)} className="text-xs text-forest-400 hover:text-forest-700">✕</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">
            Distance: <span className="tabular-nums">{dist} ft</span>
          </label>
          <input type="range" min={80} max={500} step={10} value={dist}
            onChange={(e) => setDist(Number(e.target.value))}
            className="w-full accent-forest-600" />
          <div className="flex justify-between text-[10px] text-forest-400 mt-0.5">
            <span>80ft</span><span>500ft</span>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">Wind</label>
          <div className="flex flex-col gap-1">
            {(Object.keys(WIND_LABELS) as Wind[]).map((w) => (
              <label key={w} className="flex items-center gap-1.5 text-xs cursor-pointer">
                <input type="radio" name="wind" value={w} checked={wind === w}
                  onChange={() => setWind(w)} className="accent-forest-600" />
                {WIND_LABELS[w]}
              </label>
            ))}
          </div>
        </div>
      </div>

      {recs.length === 0 ? (
        <p className="text-sm text-forest-500">No discs in your bag match those conditions. Add more discs or adjust filters.</p>
      ) : (
        <ul className="space-y-2">
          {recs.map(({ disc, reason }, i) => (
            <li key={disc.id} className="flex items-start gap-3 rounded-xl border border-forest-100 p-3">
              <span className="text-lg shrink-0">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-forest-800">{disc.discName}</span>
                  {disc.manufacturer && <span className="text-xs text-forest-400">{disc.manufacturer}</span>}
                  <span className="text-xs text-forest-400 tabular-nums">
                    {disc.speed}/{disc.glide ?? "—"}/{disc.turn ?? "—"}/{disc.fade ?? "—"}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: DISC_TYPE_COLORS[disc.type] + "22", color: DISC_TYPE_COLORS[disc.type] }}>
                    {DISC_TYPE_LABELS[disc.type]}
                  </span>
                </div>
                <p className="text-xs text-forest-500 mt-0.5">{reason}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
