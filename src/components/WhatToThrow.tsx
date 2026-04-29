"use client";
import { useState, useTransition, useMemo } from "react";
import type { BagDisc } from "@/lib/types";
import { DISC_TYPE_COLORS } from "@/lib/types";
import { recommendThrowAction } from "@/app/bag/ai-analyze";
import { fetchCourseHolesAction, type HoleData } from "@/app/bag/course-holes-action";
import { COURSES } from "@/components/CourseList";

// ── Types ─────────────────────────────────────────────────────────────────────

type Wind = "calm"|"light-headwind"|"strong-headwind"|"light-tailwind"|"strong-tailwind"|"crosswind-right"|"crosswind-left";

const WIND_OPTIONS: { value: Wind; label: string; hint: string }[] = [
  { value: "calm",            label: "Calm",             hint: "< 5 mph" },
  { value: "light-headwind",  label: "Light headwind",   hint: "5–12 mph" },
  { value: "strong-headwind", label: "Strong headwind",  hint: "13+ mph" },
  { value: "light-tailwind",  label: "Light tailwind",   hint: "5–12 mph" },
  { value: "strong-tailwind", label: "Strong tailwind",  hint: "13+ mph" },
  { value: "crosswind-right", label: "Crosswind L → R",  hint: "left-to-right" },
  { value: "crosswind-left",  label: "Crosswind R → L",  hint: "right-to-left" },
];

const WIND_DESC: Record<Wind, string> = {
  calm:"calm conditions", "light-headwind":"light headwind (~5–12 mph)", "strong-headwind":"strong headwind (13+ mph)",
  "light-tailwind":"light tailwind (~5–12 mph)", "strong-tailwind":"strong tailwind (13+ mph)",
  "crosswind-right":"right crosswind (L→R)", "crosswind-left":"left crosswind (R→L)",
};

function describeWinds(ws: Wind[]) {
  if (!ws.length || ws.includes("calm")) return "calm conditions";
  return ws.filter(w => w !== "calm").map(w => WIND_DESC[w]).join(" with ");
}

// ── Rule-based recommendation ─────────────────────────────────────────────────

function speedToFeet(s: number) { return Math.round(100 + (s - 1) * (320 / 13)); }

function ruleRecommend(discs: BagDisc[], distFt: number, winds: Set<Wind>) {
  const bag = discs.filter(d => !d.inStorage);
  if (!bag.length) return [];

  const hasStrongHead = winds.has("strong-headwind");
  const hasLightHead  = winds.has("light-headwind");
  const hasTail       = winds.has("strong-tailwind") || winds.has("light-tailwind");
  const crossRight    = winds.has("crosswind-right");
  const crossLeft     = winds.has("crosswind-left");

  const stab = (d: BagDisc) => (d.turn ?? 0) + (d.fade ?? 0);
  let stabMin = -4, stabMax = 5;
  if (hasStrongHead)             { stabMin = 1;  stabMax = 6; }
  else if (hasLightHead)         { stabMin = 0;  stabMax = 4; }
  else if (winds.has("strong-tailwind")) { stabMin = -4; stabMax = 0; }
  else if (crossRight || crossLeft)      { stabMin = 0;  stabMax = 5; }

  const idealSpeed = Math.max(1, Math.min(14, 1 + ((distFt - 100) / 320) * 13));

  const scored = bag
    .filter(d => { const s = stab(d); return s >= stabMin && s <= stabMax; })
    .map(d => ({ disc: d, score: Math.abs(d.speed - idealSpeed)*10 + Math.abs(speedToFeet(d.speed)-distFt)*0.1 }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  return scored.map(({ disc }) => {
    const s = stab(disc);
    const df = speedToFeet(disc.speed);
    const shotShape =
      s <= -3    ? "hyzer flip — release on hyzer, let it flip to flat" :
      s <= -1.5  ? "flat or slight anhyzer release" :
      s <= -0.5  ? "flat release, slight turn" :
      s <=  1    ? "flat release, straight flight" :
      s <=  2.5  ? "flat or slight hyzer, reliable fade" :
                   "hard hyzer line";
    const notes = [`${df}ft range`, shotShape];
    if (hasStrongHead) notes.push("holds up into strong headwind");
    else if (hasLightHead) notes.push("stable in headwind");
    if (hasTail) notes.push("tailwind boost");
    if (crossRight) notes.push(s > 1 ? "fade fights L→R push" : "aim further left");
    if (crossLeft)  notes.push(s < 0 ? "turn + wind — extra flex" : "aim further right");
    const power = df > distFt + 40 ? " · 70–80% power" : df < distFt - 40 ? " · full power" : "";
    return { disc, reason: notes.join(" · ") + power };
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

type Mode = "general" | "course";
const allCourses = COURSES.flatMap(g => g.courses);

export function WhatToThrow({ discs }: { discs: BagDisc[] }) {
  const [open, setOpen]         = useState(false);
  const [mode, setMode]         = useState<Mode>("general");
  const [dist, setDist]         = useState(200);
  const [winds, setWinds]       = useState<Set<Wind>>(new Set(["calm"]));
  const [aiText, setAiText]     = useState<string | null>(null);
  const [err, setErr]           = useState<string | null>(null);
  const [pending, start]        = useTransition();

  // Course mode
  const [courseSlug, setCourseSlug] = useState("");
  const [holes, setHoles]           = useState<HoleData[]>([]);
  const [selectedHole, setSelectedHole] = useState<HoleData | null>(null);
  const [loadingHoles, setLoadingHoles] = useState(false);
  const [holeErr, setHoleErr]       = useState<string | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const effectiveDist = selectedHole?.distance ?? dist;
  const recs = useMemo(() => ruleRecommend(discs, effectiveDist, winds), [discs, effectiveDist, winds]);

  function toggleWind(w: Wind) {
    setAiText(null);
    setWinds(prev => {
      const next = new Set(prev);
      if (w === "calm") return new Set(["calm"]);
      next.delete("calm");
      if (["light-headwind","strong-headwind"].includes(w)) {
        (["light-headwind","strong-headwind"] as Wind[]).filter(h=>h!==w).forEach(h=>next.delete(h));
        (["light-tailwind","strong-tailwind"] as Wind[]).forEach(t=>next.delete(t));
      }
      if (["light-tailwind","strong-tailwind"].includes(w)) {
        (["light-tailwind","strong-tailwind"] as Wind[]).filter(t=>t!==w).forEach(t=>next.delete(t));
        (["light-headwind","strong-headwind"] as Wind[]).forEach(h=>next.delete(h));
      }
      if (next.has(w)) { next.delete(w); if (!next.size) next.add("calm"); }
      else next.add(w);
      return next;
    });
  }

  async function loadCourse(slug: string) {
    setCourseSlug(slug);
    setHoles([]);
    setSelectedHole(null);
    setHoleErr(null);
    if (!slug) return;
    setLoadingHoles(true);
    const res = await fetchCourseHolesAction(slug);
    setLoadingHoles(false);
    if (res.ok) setHoles(res.holes);
    else setHoleErr(res.error);
  }

  function geoLocate() {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        const { latitude: lat, longitude: lon } = pos.coords;
        // Find nearest course by rough Euclidean distance to city coords
        const nearest = allCourses
          .filter(c => c.lat && c.lng)
          .map(c => ({ c, d: Math.hypot(c.lat! - lat, c.lng! - lon) }))
          .sort((a, b) => a.d - b.d)[0];
        if (nearest && nearest.d < 0.5) loadCourse(nearest.c.slug); // ~50km
      },
      () => setGeoLoading(false),
      { timeout: 8000 },
    );
  }

  function aiDeepDive() {
    setAiText(null); setErr(null);
    start(async () => {
      const res = await recommendThrowAction(effectiveDist, describeWinds([...winds] as Wind[]));
      if (res.ok) setAiText(res.text); else setErr(res.error);
    });
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="btn-secondary w-full text-sm">
      🎯 What should I throw?
    </button>
  );

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-forest-800">What to throw</h3>
        <button onClick={() => { setOpen(false); setAiText(null); }} className="text-xs text-forest-400 hover:text-forest-700">✕</button>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 bg-forest-50 rounded-xl p-1">
        {(["general","course"] as Mode[]).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${mode===m ? "bg-white shadow-sm text-forest-800" : "text-forest-500 hover:text-forest-700"}`}>
            {m === "general" ? "🎯 General" : "📍 At a course"}
          </button>
        ))}
      </div>

      {/* Course mode — pick course → pick hole */}
      {mode === "course" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <select value={courseSlug} onChange={e => loadCourse(e.target.value)}
              className="input-pill text-sm flex-1">
              <option value="">— Pick a course —</option>
              {COURSES.filter(g => g.courses.length).map(g => (
                <optgroup key={g.province} label={g.province}>
                  {g.courses.map(c => (
                    <option key={c.slug} value={c.slug}>{c.name} ({c.city})</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button onClick={geoLocate} disabled={geoLoading} title="Use my location"
              className="btn-secondary px-3 text-sm shrink-0">
              {geoLoading ? "…" : "📡"}
            </button>
          </div>

          {loadingHoles && <p className="text-xs text-forest-500 text-center">Loading holes from UDisc…</p>}
          {holeErr && <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">{holeErr}</p>}

          {holes.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-forest-700 block mb-1">Pick a hole</label>
              <div className="grid grid-cols-6 gap-1">
                {holes.map(h => (
                  <button key={h.hole} onClick={() => setSelectedHole(h)}
                    className={`rounded-lg py-1.5 text-xs font-semibold transition-colors ${selectedHole?.hole===h.hole ? "bg-forest-700 text-white" : "bg-forest-50 text-forest-700 hover:bg-forest-100"}`}>
                    <div>H{h.hole}</div>
                    <div className="text-[10px] opacity-75">{h.distance}ft</div>
                  </button>
                ))}
              </div>
              {selectedHole && (
                <p className="text-xs text-forest-600 mt-1">
                  Hole {selectedHole.hole} · <span className="font-semibold tabular-nums">{selectedHole.distance} ft</span>
                  {selectedHole.par ? ` · Par ${selectedHole.par}` : ""}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* General mode — distance slider */}
      {mode === "general" && (
        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">
            Distance: <span className="tabular-nums font-bold text-forest-900">{dist} ft</span>
          </label>
          <input type="range" min={60} max={500} step={10} value={dist}
            onChange={e => { setDist(Number(e.target.value)); setAiText(null); }}
            className="w-full accent-forest-600" />
          <div className="flex justify-between text-[10px] text-forest-400 mt-0.5">
            <span>60</span><span>200</span><span>350</span><span>500</span>
          </div>
        </div>
      )}

      {/* Wind */}
      <div>
        <label className="text-xs font-semibold text-forest-700 block mb-1">Wind</label>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
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

      {/* Real-time results */}
      {(!selectedHole && mode === "course") ? (
        <p className="text-xs text-forest-400 text-center">Select a hole to see recommendations</p>
      ) : recs.length === 0 ? (
        <p className="text-sm text-forest-500 text-center py-1">No matching discs for those conditions.</p>
      ) : (
        <ul className="space-y-2">
          {recs.map(({ disc, reason }, i) => (
            <li key={disc.id} className="flex items-start gap-3 rounded-xl border border-forest-100 p-2.5">
              <span className="text-base shrink-0">{["🥇","🥈","🥉"][i]}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-sm text-forest-800">{disc.discName}</span>
                  <span className="text-xs text-forest-400">{disc.manufacturer}</span>
                  <span className="text-xs tabular-nums text-forest-400">{disc.speed}/{disc.glide??'—'}/{disc.turn??'—'}/{disc.fade??'—'}</span>
                  <span className="w-2 h-2 rounded-full inline-block" style={{backgroundColor: DISC_TYPE_COLORS[disc.type]}}/>
                </div>
                <p className="text-xs text-forest-500 mt-0.5">{reason}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* AI deep dive */}
      <div className="border-t border-forest-100 pt-3 space-y-2">
        <button onClick={aiDeepDive} disabled={pending || (!selectedHole && mode==="course")}
          className="btn-secondary w-full text-xs py-1.5">
          {pending ? "Asking AI…" : "✨ AI deep dive — release angle, power & more"}
        </button>
        {err && <p className="text-xs text-red-700">{err}</p>}
        {pending && (
          <div className="space-y-1.5 animate-pulse">
            {[1,.8,.9,.7].map((w,i)=><div key={i} className="h-2.5 bg-forest-100 rounded" style={{width:`${w*100}%`}}/>)}
          </div>
        )}
        {aiText && (
          <div className="rounded-xl bg-forest-50 border border-forest-100 p-3 space-y-1">
            {aiText.split("\n").filter(Boolean).map((line,i)=>(
              <p key={i} className="text-sm text-forest-800 leading-relaxed">{line}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
