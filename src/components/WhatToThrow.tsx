"use client";
import { useState, useTransition, useMemo } from "react";
import type { BagDisc } from "@/lib/types";
import { DISC_TYPE_LABELS, DISC_TYPE_COLORS } from "@/lib/types";
import { recommendThrowAction } from "@/app/bag/ai-analyze";

type Wind = "calm" | "light-headwind" | "strong-headwind" | "light-tailwind" | "strong-tailwind" | "crosswind-right" | "crosswind-left";

const WIND_OPTIONS: { value: Wind; label: string; hint: string; group?: "head" | "tail" }[] = [
  { value: "calm",            label: "Calm",              hint: "< 5 mph" },
  { value: "light-headwind",  label: "Light headwind",    hint: "5–12 mph",  group: "head" },
  { value: "strong-headwind", label: "Strong headwind",   hint: "13+ mph",   group: "head" },
  { value: "light-tailwind",  label: "Light tailwind",    hint: "5–12 mph",  group: "tail" },
  { value: "strong-tailwind", label: "Strong tailwind",   hint: "13+ mph",   group: "tail" },
  { value: "crosswind-right", label: "Crosswind L → R",   hint: "left-to-right" },
  { value: "crosswind-left",  label: "Crosswind R → L",   hint: "right-to-left" },
];

const WIND_DESC: Record<Wind, string> = {
  "calm":            "calm conditions",
  "light-headwind":  "light headwind (~5–12 mph)",
  "strong-headwind": "strong headwind (13+ mph)",
  "light-tailwind":  "light tailwind (~5–12 mph)",
  "strong-tailwind": "strong tailwind (13+ mph)",
  "crosswind-right": "right crosswind (blowing left to right)",
  "crosswind-left":  "left crosswind (blowing right to left)",
};

function describeWinds(selected: Wind[]): string {
  if (selected.length === 0 || selected.includes("calm")) return "calm conditions";
  return selected.filter(w => w !== "calm").map(w => WIND_DESC[w]).join(" with ");
}

function speedToFeet(speed: number) { return Math.round(100 + (speed - 1) * (320 / 13)); }

function ruleRecommend(discs: BagDisc[], distFt: number, winds: Set<Wind>): { disc: BagDisc; reason: string }[] {
  const bag = discs.filter(d => !d.inStorage);
  if (bag.length === 0) return [];

  const hasStrongHead = winds.has("strong-headwind");
  const hasLightHead  = winds.has("light-headwind");
  const hasStrongTail = winds.has("strong-tailwind");
  const hasCross      = winds.has("crosswind-right") || winds.has("crosswind-left");

  const stab = (d: BagDisc) => (d.turn ?? 0) + (d.fade ?? 0);

  // Stability target based on wind
  let stabMin = -4, stabMax = 5;
  if (hasStrongHead) { stabMin = 1; stabMax = 6; }        // very overstable into wind
  else if (hasLightHead) { stabMin = 0; stabMax = 4; }    // mildly overstable
  else if (hasStrongTail) { stabMin = -4; stabMax = 0; }  // understable with tailwind
  else if (hasCross) { stabMin = 0; stabMax = 5; }        // overstable to hold line

  const idealSpeed = Math.max(1, Math.min(14, 1 + ((distFt - 100) / 320) * 13));

  const scored = bag
    .filter(d => {
      const s = stab(d);
      return s >= stabMin && s <= stabMax;
    })
    .map(d => {
      const speedDelta = Math.abs(d.speed - idealSpeed);
      const distDelta  = Math.abs(speedToFeet(d.speed) - distFt);
      return { disc: d, score: speedDelta * 10 + distDelta * 0.1 };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  const crossRight = winds.has("crosswind-right");
  const crossLeft  = winds.has("crosswind-left");

  return scored.map(({ disc }) => {
    const s = stab(disc);
    const stabDesc = s > 1.5 ? "overstable" : s < -0.5 ? "understable" : "neutral";
    const distFeet = speedToFeet(disc.speed);
    const distNote = distFeet > distFt + 40 ? "70–80% power"
      : distFeet < distFt - 40 ? "full power" : "";

    // Shot shape advice based on stability
    let shotShape = "";
    if (s <= -3)      shotShape = "hyzer flip — release on hyzer and let it flip to flat";
    else if (s <= -1.5) shotShape = "flat or slight anhyzer release";
    else if (s <= -0.5) shotShape = "flat release, will turn slightly";
    else if (s <= 1)    shotShape = "flat release, straight flight";
    else if (s <= 2.5)  shotShape = "flat or slight hyzer for a reliable fade";
    else                shotShape = "hard hyzer line";

    const notes: string[] = [`${distFeet}ft range`];
    notes.push(shotShape);

    // Wind-specific guidance
    if (hasStrongHead) notes.push("holds up into strong headwind");
    else if (hasLightHead) notes.push("stable in headwind");

    if (hasStrongTail) notes.push("extra distance with tailwind");
    else if (winds.has("light-tailwind")) notes.push("tailwind boost");

    if (crossRight) {
      // L→R wind: disc gets pushed right; use more fade to push back left, or aim left
      const crossNote = s > 1 ? "overstable fade fights the L→R push" : "aim further left to compensate L→R wind";
      notes.push(crossNote);
    }
    if (crossLeft) {
      // R→L wind: disc gets pushed left; understable turn + wind combo, or aim right
      const crossNote = s < 0 ? "understable + R→L wind — extra right flex shot" : "aim right to compensate R→L wind";
      notes.push(crossNote);
    }

    if (distNote) notes.push(distNote);
    return { disc, reason: notes.join(" · ") };
  });
}

export function WhatToThrow({ discs }: { discs: BagDisc[] }) {
  const [open, setOpen] = useState(false);
  const [dist, setDist] = useState(200);
  const [winds, setWinds] = useState<Set<Wind>>(new Set(["calm"]));
  const [aiText, setAiText] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const recs = useMemo(() => ruleRecommend(discs, dist, winds), [discs, dist, winds]);

  function toggleWind(w: Wind) {
    setAiText(null);
    setWinds(prev => {
      const next = new Set(prev);
      if (w === "calm") return new Set(["calm"]);
      next.delete("calm");
      if (["light-headwind","strong-headwind"].includes(w)) {
        ["light-headwind","strong-headwind"].filter(h => h !== w).forEach(h => next.delete(h as Wind));
        ["light-tailwind","strong-tailwind"].forEach(t => next.delete(t as Wind));
      }
      if (["light-tailwind","strong-tailwind"].includes(w)) {
        ["light-tailwind","strong-tailwind"].filter(t => t !== w).forEach(t => next.delete(t as Wind));
        ["light-headwind","strong-headwind"].forEach(h => next.delete(h as Wind));
      }
      if (next.has(w)) { next.delete(w); if (next.size === 0) next.add("calm"); }
      else next.add(w);
      return next;
    });
  }

  function aiDeepDive() {
    setAiText(null);
    setErr(null);
    startTransition(async () => {
      const res = await recommendThrowAction(dist, describeWinds([...winds] as Wind[]));
      if (res.ok) setAiText(res.text);
      else setErr(res.error);
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary w-full text-sm">
        🎯 What should I throw?
      </button>
    );
  }

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-forest-800">What to throw</h3>
        <button onClick={() => { setOpen(false); setAiText(null); }} className="text-xs text-forest-400 hover:text-forest-700">✕</button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">
            Distance: <span className="tabular-nums font-bold text-forest-900">{dist} ft</span>
          </label>
          <input type="range" min={60} max={500} step={10} value={dist}
            onChange={(e) => { setDist(Number(e.target.value)); setAiText(null); }}
            className="w-full accent-forest-600" />
          <div className="flex justify-between text-[10px] text-forest-400 mt-0.5">
            <span>60</span><span>200</span><span>350</span><span>500</span>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">Wind</label>
          <div className="space-y-0.5">
            {WIND_OPTIONS.map(w => (
              <label key={w.value}
                className={`flex items-center gap-1.5 text-xs cursor-pointer px-2 py-0.5 rounded-lg transition-colors ${winds.has(w.value) ? "bg-forest-100 font-semibold text-forest-800" : "text-forest-600 hover:bg-forest-50"}`}>
                <input type="checkbox" checked={winds.has(w.value)} onChange={() => toggleWind(w.value)} className="accent-forest-600 shrink-0" />
                <span>{w.label}</span>
                <span className="text-forest-400 text-[10px]">{w.hint}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time rule-based results */}
      {recs.length === 0 ? (
        <p className="text-sm text-forest-500 text-center py-2">No matching discs in your bag for those conditions.</p>
      ) : (
        <ul className="space-y-2">
          {recs.map(({ disc, reason }, i) => (
            <li key={disc.id} className="flex items-start gap-3 rounded-xl border border-forest-100 p-2.5">
              <span className="text-base shrink-0">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-sm text-forest-800">{disc.discName}</span>
                  <span className="text-xs text-forest-400">{disc.manufacturer}</span>
                  <span className="text-xs tabular-nums text-forest-400">{disc.speed}/{disc.glide ?? "—"}/{disc.turn ?? "—"}/{disc.fade ?? "—"}</span>
                </div>
                <p className="text-xs text-forest-500 mt-0.5">{reason}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* AI deep dive */}
      <div className="border-t border-forest-100 pt-3 space-y-2">
        <button onClick={aiDeepDive} disabled={pending}
          className="btn-secondary w-full text-xs py-1.5">
          {pending ? "Asking AI…" : "✨ AI deep dive — release angle, power level & more"}
        </button>
        {err && <p className="text-xs text-red-700">{err}</p>}
        {pending && (
          <div className="space-y-1.5 animate-pulse">
            {[1, 0.8, 0.9, 0.7].map((w, i) => <div key={i} className="h-2.5 bg-forest-100 rounded" style={{ width: `${w * 100}%` }} />)}
          </div>
        )}
        {aiText && (
          <div className="rounded-xl bg-forest-50 border border-forest-100 p-3 space-y-1">
            {aiText.split("\n").filter(Boolean).map((line, i) => (
              <p key={i} className="text-sm text-forest-800 leading-relaxed">{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
