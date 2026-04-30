"use client";
import { useState, useTransition, useMemo, useEffect } from "react";
import type { BagDisc } from "@/lib/types";
import { DISC_TYPE_COLORS } from "@/lib/types";
import { recommendThrowAction } from "@/app/bag/ai-analyze";
import { fetchCourseHolesAction, type HoleData } from "@/app/bag/course-holes-action";
import { COURSES } from "@/components/CourseList";
import { loadPrefs, type BagPrefs } from "@/components/BagSettings";
import { plasticStabOffset } from "@/lib/plastics-db";
import type { UserPrefs } from "@/lib/store";
import { AI_FACTORS } from "@/lib/ai-factors";
import { AIFactorsBadge } from "@/components/AIFactorsBadge";

// ── Wind types ─────────────────────────────────────────────────────────────────
type WindDir = "none" | "head" | "tail";
type WindStr = "light" | "strong";
type CrossWind = "none" | "ltor" | "rtol";

const WIND_DESC_MAP: Record<string, string> = {
  "none-none":    "calm conditions",
  "head-light":   "light headwind (~5–12 mph)",
  "head-strong":  "strong headwind (13+ mph)",
  "tail-light":   "light tailwind (~5–12 mph)",
  "tail-strong":  "strong tailwind (13+ mph)",
  "cross-ltor":   "left-to-right crosswind",
  "cross-rtol":   "right-to-left crosswind",
};

// ── Shot shapes ────────────────────────────────────────────────────────────────
type ShotShape = "straight" | "dogleg-right" | "dogleg-left" | "wooded" | "downhill" | "uphill";
const SHOT_SHAPES: { value: ShotShape; label: string; emoji: string }[] = [
  { value: "straight",     label: "Straight / open",  emoji: "↑" },
  { value: "dogleg-right", label: "Dogleg right",      emoji: "↗" },
  { value: "dogleg-left",  label: "Dogleg left",       emoji: "↖" },
  { value: "wooded",       label: "Wooded / tunnel",   emoji: "🌲" },
  { value: "downhill",     label: "Downhill",          emoji: "⬇" },
  { value: "uphill",       label: "Uphill",            emoji: "⬆" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function speedToFeet(s: number) { return Math.round(100 + (s - 1) * (320 / 13)); }
function maxUsableSpeed(maxDist: number) { return Math.min(15, Math.max(2, 1 + (maxDist - 100) / (320 / 13))); }

function buildWindDesc(dir: WindDir, str: WindStr, cross: CrossWind): string {
  const parts: string[] = [];
  if (dir !== "none") parts.push(WIND_DESC_MAP[`${dir}-${str}`]);
  if (cross !== "none") parts.push(WIND_DESC_MAP[`cross-${cross}`]);
  return parts.length ? parts.join(" with ") : "calm conditions";
}

// ── Rule-based recommendation ──────────────────────────────────────────────────
function ruleRecommend(
  discs: BagDisc[], distFt: number,
  windDir: WindDir, windStr: WindStr, cross: CrossWind,
  shape: ShotShape, playerMaxDist: number, playStyle: string,
) {
  const bag = discs.filter(d => !d.inStorage);
  if (!bag.length) return [];
  const maxSpeed = maxUsableSpeed(playerMaxDist);

  // Effective stability: numbers + weight + plastic + condition
  const effStab = (d: BagDisc) => {
    const base = (d.turn ?? 0) + (d.fade ?? 0);
    const wt   = d.weightG ? (d.weightG - 170) * 0.02 : 0;
    const pl   = plasticStabOffset(d.manufacturer, d.plastic ?? "");
    const cond = d.notes?.includes("Beat in") ? -0.7
               : d.notes?.includes("Slightly beat") ? -0.3
               : d.notes?.includes("OS flip") ? -1.0 : 0;
    return base + wt + pl + cond;
  };

  // Play style stability offset
  const styleOff = playStyle === "hyzer_flip" ? -0.8 : playStyle === "anhyzer" ? -1.2 : 0;

  // Shot shape stability offset AND window override
  const shapeOff = shape === "dogleg-right" ? -2.0   // need understable to turn right naturally
                 : shape === "dogleg-left"  ?  2.0   // need overstable to fade left
                 : shape === "downhill"     ? -0.5   // hills make discs fly more understable
                 : shape === "uphill"       ?  0.5   // discs fade harder uphill
                 : 0;

  // Wooded/tunnel: override stabMin/stabMax to tightest neutral window — straightest disc wins
  const woodedOverride = shape === "wooded";

  const totalOffset = styleOff + shapeOff;

  // Stability window by wind — calm is deliberately tighter to avoid extreme discs
  let stabMin: number, stabMax: number;
  if      (windDir === "head" && windStr === "strong") { stabMin = 1;              stabMax = 6; }
  else if (windDir === "head" && windStr === "light")  { stabMin = 0 + totalOffset; stabMax = 4 + totalOffset; }
  else if (windDir === "tail" && windStr === "strong") { stabMin = -4 + totalOffset; stabMax = -0.5 + totalOffset; }
  else if (windDir === "tail" && windStr === "light")  { stabMin = -3 + totalOffset; stabMax = 1 + totalOffset; }
  else if (cross !== "none")                           { stabMin = 0 + totalOffset; stabMax = 5 + totalOffset; }
  else /* calm */                                      { stabMin = -2.5 + totalOffset; stabMax = 2.5 + totalOffset; }

  // Wooded/tunnel overrides to near-neutral only — straightest disc wins
  if (woodedOverride) { stabMin = -1.0; stabMax = 1.0; }

  // Approach zone: sub-150ft → no distance drivers
  const approachOnly = distFt < 150;

  // Speed cap: always apply, but tailwind gets +2 grace (wind assist helps)
  const speedGrace = windDir === "tail" && windStr === "strong" ? 3
                   : windDir === "tail" ? 2 : 0;
  const effectiveMaxSpeed = maxSpeed + speedGrace;

  const idealSpeed = Math.max(1, Math.min(15, 1 + ((distFt - 100) / 320) * 13));

  const scored = bag
    .filter(d => {
      const s = effStab(d);
      if (s < stabMin || s > stabMax) return false;
      if (d.speed > effectiveMaxSpeed) return false;
      if (approachOnly && d.type === "distance_driver") return false;
      return true;
    })
    .map(d => {
      const discMaxFt = speedToFeet(d.speed);
      // Light penalty — type zone does the heavy lifting for disc selection
      const distDelta = discMaxFt < distFt
        ? (distFt - discMaxFt) * 0.1   // can throw harder to reach
        : (discMaxFt - distFt) * 0.05; // can throttle back
      // Type zone — midrange strongly preferred at mid distances
      const typeBonus =
        distFt < 150  && d.type === "putter"           ? -7 :
        distFt < 150  && d.type === "midrange"         ? -3 :
        distFt < 200  && d.type === "midrange"         ? -6 :
        distFt < 200  && d.type === "fairway_driver"   ? -1 :
        distFt < 310  && d.type === "midrange"         ? -5 : // midrange is the right tool
        distFt < 310  && d.type === "fairway_driver"   ? -2 :
        distFt < 380  && d.type === "fairway_driver"   ? -5 :
        distFt < 380  && d.type === "distance_driver"  ? -2 :
        distFt >= 380 && d.type === "distance_driver"  ? -5 :
        distFt >= 380 && d.type === "fairway_driver"   ? -1 : 0;
      return { disc: d, score: distDelta + typeBonus };
    })
    .sort((a, b) => a.score - b.score)
    .filter((item, idx, arr) => arr.findIndex(x => x.disc.discName === item.disc.discName) === idx)
    .slice(0, 3);

  return scored.map(({ disc }) => {
    const s = effStab(disc);
    const df = speedToFeet(disc.speed);
    const shotShape =
      s <= -3   ? "hyzer flip — release on hyzer, let it turn flat" :
      s <= -1.5 ? "flat or slight anhyzer release" :
      s <= -0.5 ? "flat, slight turn" :
      s <=  1   ? "flat release, straight flight" :
      s <=  2.5 ? "flat or slight hyzer, reliable fade" :
                  "hard hyzer line";

    const notes = [`${df}ft range`, shotShape];

    // Shape-specific notes
    if (shape === "dogleg-right" && s < -0.5) notes.push("natural turn shapes the dogleg");
    if (shape === "dogleg-left"  && s > 0.5)  notes.push("fade finishes into the dogleg");
    if (shape === "wooded")  notes.push("straight flight threads the gap");
    if (shape === "downhill") notes.push("aim conservatively — hill adds distance");
    if (shape === "uphill")   notes.push("throw harder than normal, disc fades early");

    // Wind notes
    if (windDir === "head" && windStr === "strong") notes.push("punches into headwind");
    else if (windDir === "head") notes.push("stable in headwind");
    if (windDir === "tail" && windStr === "strong") {
      notes.push("strong tailwind — let it turn");
      if (disc.speed > maxSpeed) notes.push(`speed ${disc.speed} usable with wind`);
    } else if (windDir === "tail") notes.push("tailwind boost");
    if (cross === "ltor") notes.push(s > 1 ? "fade fights L→R push" : "aim further left");
    if (cross === "rtol") notes.push(s < 0 ? "turn + wind — flex shot" : "aim further right");

    const power = df > distFt + 40 ? " · 70–80% power" : df < distFt - 40 ? " · full power" : "";
    return { disc, reason: notes.join(" · ") + power };
  });
}

// ── Component ──────────────────────────────────────────────────────────────────
type Mode = "general" | "course";
const allCourses = COURSES.flatMap(g => g.courses);

export function WhatToThrow({ discs, serverPrefs }: { discs: BagDisc[]; serverPrefs?: UserPrefs }) {
  const [open, setOpen]     = useState(false);
  const [mode, setMode]     = useState<Mode>("course");
  const [dist, setDist]     = useState(200);
  // Wind
  const [windDir, setWindDir]   = useState<WindDir>("none");
  const [windStr, setWindStr]   = useState<WindStr>("light");
  const [cross, setCross]       = useState<CrossWind>("none");
  // Shape
  const [shape, setShape]   = useState<ShotShape>("straight");
  // AI
  const [aiText, setAiText] = useState<string | null>(null);
  const [err, setErr]       = useState<string | null>(null);
  const [pending, start]    = useTransition();
  // Course
  const [courseSlug, setCourseSlug]       = useState("");
  const [holes, setHoles]                 = useState<HoleData[]>([]);
  const [selectedHole, setSelectedHole]   = useState<HoleData | null>(null);
  const [loadingHoles, setLoadingHoles]   = useState(false);
  const [holeErr, setHoleErr]             = useState<string | null>(null);
  const [geoLoading, setGeoLoading]       = useState(false);

  const localPrefs = typeof window !== "undefined" ? loadPrefs() : {} as BagPrefs;
  const playerMaxDist = serverPrefs?.maxDistFt ?? localPrefs.maxDist ?? 300;
  const playStyle     = serverPrefs?.playStyle  ?? localPrefs.playStyle ?? "flat";

  const effectiveDist = selectedHole?.distance ?? dist;
  const recs = useMemo(
    () => ruleRecommend(discs, effectiveDist, windDir, windStr, cross, shape, playerMaxDist, playStyle),
    [discs, effectiveDist, windDir, windStr, cross, shape, playerMaxDist, playStyle]
  );

  function aiDeepDive() {
    setAiText(null); setErr(null);
    const windDesc = buildWindDesc(windDir, windStr, cross);
    start(async () => {
      const res = await recommendThrowAction(effectiveDist, windDesc);
      if (res.ok) setAiText(res.text); else setErr(res.error);
    });
  }

  async function loadCourse(slug: string) {
    setCourseSlug(slug); setHoles([]); setSelectedHole(null); setHoleErr(null);
    if (!slug) return;
    setLoadingHoles(true);
    const res = await fetchCourseHolesAction(slug);
    setLoadingHoles(false);
    if (res.ok) setHoles(res.holes); else setHoleErr(res.error);
  }

  function geoLocate() {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(pos => {
      setGeoLoading(false);
      const { latitude: lat, longitude: lon } = pos.coords;
      const nearest = allCourses.filter(c => c.lat && c.lng)
        .map(c => ({ c, d: Math.hypot(c.lat! - lat, c.lng! - lon) }))
        .sort((a, b) => a.d - b.d)[0];
      if (nearest && nearest.d < 0.5) loadCourse(nearest.c.slug);
    }, () => setGeoLoading(false), { timeout: 8000 });
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="btn-secondary w-full text-sm">
      🎯 What should I throw?
    </button>
  );

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <h3 className="font-display font-bold text-forest-800">What to throw</h3>
          <AIFactorsBadge factors={AI_FACTORS.whatToThrow} direction="down" />
        </div>
        <button onClick={() => { setOpen(false); setAiText(null); }} className="text-xs text-forest-400 hover:text-forest-700">✕</button>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 bg-forest-50 rounded-xl p-1">
        {(["course","general"] as Mode[]).map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${mode===m?"bg-white shadow-sm text-forest-800":"text-forest-500 hover:text-forest-700"}`}>
            {m==="course" ? "📍 At a course" : "🎯 General"}
          </button>
        ))}
      </div>

      {/* Course picker */}
      {mode==="course" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <select value={courseSlug} onChange={e => loadCourse(e.target.value)} className="input-pill text-sm flex-1">
              <option value="">— Pick a course —</option>
              {COURSES.filter(g=>g.courses.length).map(g=>(
                <optgroup key={g.province} label={g.province}>
                  {g.courses.map(c=><option key={c.slug} value={c.slug}>{c.name} ({c.city})</option>)}
                </optgroup>
              ))}
            </select>
            <button onClick={geoLocate} disabled={geoLoading} title="Use my location" className="btn-secondary px-3 text-sm shrink-0">
              {geoLoading?"…":"📡"}
            </button>
          </div>
          {loadingHoles && <p className="text-xs text-forest-500 text-center">Loading holes…</p>}
          {holeErr && <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">{holeErr}</p>}
          {holes.length > 0 && (
            <div className="grid grid-cols-6 gap-1">
              {holes.map(h=>(
                <button key={h.hole} onClick={()=>setSelectedHole(h)}
                  className={`rounded-lg py-1.5 text-xs font-semibold transition-colors ${selectedHole?.hole===h.hole?"bg-forest-700 text-white":"bg-forest-50 text-forest-700 hover:bg-forest-100"}`}>
                  <div>H{h.hole}</div>
                  <div className="text-[10px] opacity-75">{h.distance}ft</div>
                </button>
              ))}
            </div>
          )}
          {selectedHole && (
            <p className="text-xs text-forest-600">
              Hole {selectedHole.hole} · <span className="font-semibold">{selectedHole.distance} ft</span>
              {selectedHole.par ? ` · Par ${selectedHole.par}` : ""}
            </p>
          )}
        </div>
      )}

      {/* General distance */}
      {mode==="general" && (
        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">
            Distance: <span className="tabular-nums font-bold text-forest-900">{dist} ft</span>
          </label>
          <input type="range" min={60} max={500} step={10} value={dist}
            onChange={e=>{setDist(Number(e.target.value));setAiText(null);}}
            className="w-full accent-forest-600"/>
          <div className="flex justify-between text-[10px] text-forest-400 mt-0.5">
            <span>60</span><span>200</span><span>350</span><span>500</span>
          </div>
        </div>
      )}

      {/* Shot shape */}
      <div>
        <label className="text-xs font-semibold text-forest-700 block mb-1.5">Shot shape</label>
        <div className="grid grid-cols-3 gap-1">
          {SHOT_SHAPES.map(s=>(
            <button key={s.value} onClick={()=>{setShape(s.value);setAiText(null);}}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${shape===s.value?"bg-forest-700 text-white":"bg-forest-50 text-forest-600 hover:bg-forest-100"}`}>
              <span>{s.emoji}</span><span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Wind — compact redesign */}
      <div>
        <label className="text-xs font-semibold text-forest-700 block mb-1.5">Wind</label>
        <div className="space-y-2">
          {/* Direction row */}
          <div className="flex gap-1">
            {([["none","Calm"],["head","Headwind"],["tail","Tailwind"]] as [WindDir,string][]).map(([v,l])=>(
              <button key={v} onClick={()=>{setWindDir(v);setAiText(null);}}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${windDir===v?"bg-forest-700 text-white":"bg-forest-50 text-forest-600 hover:bg-forest-100"}`}>
                {l}
              </button>
            ))}
          </div>
          {/* Strength — only when head or tail */}
          {windDir!=="none" && (
            <div className="flex gap-1">
              {([["light","Light (5–12 mph)"],["strong","Strong (13+ mph)"]] as [WindStr,string][]).map(([v,l])=>(
                <button key={v} onClick={()=>{setWindStr(v);setAiText(null);}}
                  className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${windStr===v?"bg-forest-600 text-white":"bg-forest-50 text-forest-500 hover:bg-forest-100"}`}>
                  {l}
                </button>
              ))}
            </div>
          )}
          {/* Crosswind row */}
          <div className="flex gap-1">
            {([["none","No cross"],["ltor","L → R"],["rtol","R → L"]] as [CrossWind,string][]).map(([v,l])=>(
              <button key={v} onClick={()=>{setCross(v);setAiText(null);}}
                className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${cross===v?"bg-forest-600 text-white":"bg-forest-50 text-forest-500 hover:bg-forest-100"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {(!selectedHole && mode==="course") ? (
        <p className="text-xs text-forest-400 text-center">Select a hole to see recommendations</p>
      ) : recs.length===0 ? (
        <p className="text-sm text-forest-500 text-center">No matching discs in your bag. Adjust filters or try a different shot shape.</p>
      ) : (
        <ul className="space-y-2">
          {recs.map(({disc,reason},i)=>(
            <li key={disc.id} className="flex items-start gap-3 rounded-xl border border-forest-100 p-2.5">
              <span className="text-base shrink-0">{["🥇","🥈","🥉"][i]}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-sm text-forest-800">{disc.discName}</span>
                  {disc.nickname && <span className="text-xs text-forest-500 italic">"{disc.nickname}"</span>}
                  <span className="text-xs text-forest-400">{disc.manufacturer}</span>
                  <span className="text-xs tabular-nums text-forest-400">{disc.speed}/{disc.glide??'—'}/{disc.turn??'—'}/{disc.fade??'—'}</span>
                  <span className="w-2 h-2 rounded-full inline-block" style={{backgroundColor:DISC_TYPE_COLORS[disc.type]}}/>
                </div>
                <p className="text-xs text-forest-500 mt-0.5">{reason}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* AI deep dive */}
      <div className="border-t border-forest-100 pt-3 space-y-2">
        <span className="flex items-center gap-1">
          <button onClick={aiDeepDive} disabled={pending||(!selectedHole&&mode==="course")}
            className="btn-secondary flex-1 text-xs py-1.5">
            {pending?"Asking AI…":"✨ AI deep dive — release angle, power & more"}
          </button>
          <AIFactorsBadge factors={AI_FACTORS.whatToThrow} />
        </span>
        {err&&<p className="text-xs text-red-700">{err}</p>}
        {pending&&<div className="space-y-1.5 animate-pulse">{[1,.8,.9,.7].map((w,i)=><div key={i} className="h-2.5 bg-forest-100 rounded" style={{width:`${w*100}%`}}/>)}</div>}
        {aiText&&(
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
