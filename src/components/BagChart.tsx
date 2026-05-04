"use client";
import { useState } from "react";
import type { BagDisc } from "@/lib/types";
import { DISC_TYPE_COLORS, DISC_TYPE_LABELS } from "@/lib/types";

export type ChartPrefs = {
  throwStyle?: "RHBH" | "LHFH" | "RHFH" | "LHBH";
  showNamesChart?: boolean;
  showNamesFlight?: boolean;
};

// ── Stability scatter plot ────────────────────────────────────────────────────
// X: Stability (turn+fade) — overstable LEFT, understable RIGHT
// Y: Speed — slow BOTTOM, fast TOP

const SW = 580, SH = 340, SPL = 44, SPT = 16, SPR = 16, SPB = 44;
const SPW = SW - SPL - SPR, SPH = SH - SPT - SPB;
const STAB_MAX = 6, STAB_MIN = -5, SPD_MIN = 0, SPD_MAX = 15;

function sx(stab: number) { return SPL + ((STAB_MAX - stab) / (STAB_MAX - STAB_MIN)) * SPW; }
function sy(speed: number) { return SPT + SPH - ((speed - SPD_MIN) / (SPD_MAX - SPD_MIN)) * SPH; }

function ScatterPlot({ discs, hovered, setHovered, showNames, onClickDisc, focused }: {
  discs: BagDisc[]; hovered: string | null; focused: string | null;
  setHovered: (id: string | null) => void; showNames: boolean;
  onClickDisc: (id: string) => void;
}) {
  const stabTicks = [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
  const spdTicks  = [2, 4, 6, 8, 10, 12, 14, 15];

  return (
    <svg viewBox={`0 0 ${SW} ${SH}`} className="w-full min-w-[300px] rounded-xl border border-forest-100 bg-white">
      {/* Zone fills */}
      <rect x={SPL} y={SPT} width={sx(1)-SPL} height={SPH} fill="#fee2e2" opacity={0.4}/>
      <rect x={sx(1)} y={SPT} width={sx(-1)-sx(1)} height={SPH} fill="#fef9c3" opacity={0.4}/>
      <rect x={sx(-1)} y={SPT} width={SPL+SPW-sx(-1)} height={SPH} fill="#dcfce7" opacity={0.4}/>

      {/* Zone labels inside zones */}
      <text x={SPL+4} y={SPT+11} fontSize={8} fill="#ef4444" opacity={0.8} fontWeight="600">OS</text>
      <text x={sx(1)+4} y={SPT+11} fontSize={8} fill="#d97706" opacity={0.8} fontWeight="600">Neutral</text>
      <text x={sx(-1)+4} y={SPT+11} fontSize={8} fill="#16a34a" opacity={0.8} fontWeight="600">US</text>

      {/* Grid lines */}
      {stabTicks.map(s=><line key={s} x1={sx(s)} y1={SPT} x2={sx(s)} y2={SPT+SPH} stroke="#d1d5db" strokeWidth={s===0?1.5:0.5}/>)}
      {spdTicks.map(sp=><line key={sp} x1={SPL} y1={sy(sp)} x2={SPL+SPW} y2={sy(sp)} stroke="#d1d5db" strokeWidth={0.5}/>)}

      {/* X-axis ticks */}
      {stabTicks.map(s=>(
        <text key={s} x={sx(s)} y={SH-SPB+14} textAnchor="middle" fontSize={10} fill="#6b7280">{s>0?`+${s}`:s}</text>
      ))}
      {/* X-axis labels — left/right, above tick numbers */}
      <text x={SPL+8} y={SH-SPB+28} fontSize={9} fill="#9ca3af">← Overstable</text>
      <text x={SPL+SPW-8} y={SH-SPB+28} textAnchor="end" fontSize={9} fill="#9ca3af">Understable →</text>

      {/* Y-axis */}
      {spdTicks.map(sp=><text key={sp} x={SPL-4} y={sy(sp)+4} textAnchor="end" fontSize={10} fill="#6b7280">{sp}</text>)}
      <text x={11} y={SPT+SPH/2} textAnchor="middle" fontSize={10} fill="#374151" fontWeight="500"
        transform={`rotate(-90 11 ${SPT+SPH/2})`}>Speed</text>

      {/* Border */}
      <rect x={SPL} y={SPT} width={SPW} height={SPH} fill="none" stroke="#e5e7eb"/>

      {/* Discs — render non-hovered first so hovered names appear on top */}
      {[...discs].sort((a,b)=>(hovered===b.id?-1:hovered===a.id?1:0)).map(d=>{
        const stab=(d.turn??0)+(d.fade??0);
        const x=sx(stab), y=sy(d.speed);
        const isHov=hovered===d.id;
        const col=d.color ? colorToHex(d.color) : DISC_TYPE_COLORS[d.type];
        return (
          <g key={d.id} style={{cursor:"pointer"}}
            onMouseEnter={()=>setHovered(d.id)} onMouseLeave={()=>setHovered(null)} onClick={()=>onClickDisc(d.id)}>
            <circle cx={x} cy={y} r={isHov?10:7} fill={col} stroke={strokeFor(col)} strokeWidth={isHov?2.5:2} opacity={isHov?1:0.85}/>
            <text x={x} y={y+3.5} textAnchor="middle" fontSize={7} fill="white" fontWeight="700" pointerEvents="none">{d.speed}</text>
            {(showNames||isHov) && (
              <text x={x} y={y-13} textAnchor="middle" fontSize={9} fill="#111827" fontWeight={isHov?"700":"500"}
                stroke="white" strokeWidth={3} paintOrder="stroke" pointerEvents="none">{d.discName}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Flight path view ──────────────────────────────────────────────────────────
// Top-down view. Disc thrown from bottom-center.
// Y = forward distance. X = lateral (positive = right for RHBH).
// Turn (negative number) → curves right → positive X
// Fade (positive number) → fades left  → negative X

const FW = 580, FH = 360, FPL = 48, FPT = 16, FPR = 40, FPB = 36;
const FPW = FW-FPL-FPR, FPH = FH-FPT-FPB;
const LAT_RANGE = 60; // ±60 ft lateral each side

// Realistic distance estimate (feet) per speed rating for an average player
function speedToFeet(speed: number) { return Math.round(100 + (speed - 1) * (320 / 13)); }

function toFx(lat: number) { return FPL + FPW/2 + (lat/LAT_RANGE)*FPW/2; }
function toFy(distFt: number, maxFt: number) {
  return FPT + FPH - Math.min(distFt/maxFt, 1)*FPH;
}

function FlightPaths({ discs, hovered, setHovered, showNames, flipLateral, onClickDisc, focused }: {
  discs: BagDisc[]; hovered: string|null; focused: string|null;
  setHovered: (id:string|null)=>void; showNames: boolean; flipLateral: boolean;
  onClickDisc: (id: string) => void;
}) {
  if (discs.length===0) return null;
  const maxFt = Math.max(...discs.map(d=>speedToFeet(d.speed)), 150);
  const flip = flipLateral ? -1 : 1;

  const paths = discs.map(d=>{
    const turn=d.turn??0, fade=d.fade??0;
    const distFt = speedToFeet(d.speed);
    // Lateral deviation in feet (RHBH): negative turn → right (+X), fade → left (-X)
    const peakLat  = flip * (-(turn) * 5);
    const endLat   = flip * (-(turn) * 2 - fade * 4);

    // S-curve: if turn and fade have opposite signs, the disc curves one way then back
    const hasSCurve = (turn < -0.5) && (fade > 0.5);

    const x0=toFx(0), y0=toFy(0,maxFt);
    let c1x, c1y, c2x, c2y;

    if (hasSCurve) {
      // S-curve: peak early, fade-back late
      c1x = toFx(peakLat * 1.3);
      c1y = toFy(distFt * 0.25, maxFt);
      c2x = toFx(endLat * 0.6);
      c2y = toFy(distFt * 0.75, maxFt);
    } else {
      // Standard curve: turn dominates. Control points follow the turn magnitude.
      // For discs with minimal fade, weight second control toward end (no fade-back)
      const fadeInfluence = Math.max(0, fade); // fade > 0 pulls back toward center
      c1x = toFx(peakLat * 1.1);
      c1y = toFy(distFt * 0.33, maxFt);
      c2x = toFx(endLat + (peakLat - endLat) * fadeInfluence * 0.3);
      c2y = toFy(distFt * 0.67, maxFt);
    }

    const ex=toFx(endLat), ey=toFy(distFt, maxFt);
    return { d, path:`M ${x0} ${y0} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${ex} ${ey}`, ex, ey, distFt };
  });

  const centerX = toFx(0);
  const distTicks = [0,100,150,200,250,300,350,400].filter(v=>v<=maxFt);

  return (
    <svg viewBox={`0 0 ${FW} ${FH}`} className="w-full min-w-[300px] rounded-xl border border-forest-100 bg-white">
      {/* Grid */}
      {distTicks.map(v=>(
        <g key={v}>
          <line x1={FPL} y1={toFy(v,maxFt)} x2={FPL+FPW} y2={toFy(v,maxFt)} stroke="#e5e7eb" strokeWidth={0.5}/>
          <text x={FPL-4} y={toFy(v,maxFt)+4} textAnchor="end" fontSize={9} fill="#9ca3af">{v}</text>
        </g>
      ))}

      {/* Centre line */}
      <line x1={centerX} y1={FPT} x2={centerX} y2={FPT+FPH} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="4 3"/>

      {/* Left/right labels */}
      <text x={FPL+2} y={FPT+FPH-4} fontSize={8} fill="#d1d5db">{flipLateral ? "RIGHT" : "LEFT"}</text>
      <text x={FPL+FPW-2} y={FPT+FPH-4} textAnchor="end" fontSize={8} fill="#d1d5db">{flipLateral ? "LEFT" : "RIGHT"}</text>
      <text x={FPL-4} y={FPT+10} textAnchor="end" fontSize={9} fill="#9ca3af">ft est.</text>

      {/* Throw origin */}
      <circle cx={centerX} cy={FPT+FPH} r={4} fill="#374151"/>
      <text x={centerX} y={FPT+FPH+12} textAnchor="middle" fontSize={8} fill="#9ca3af">throw</text>

      {/* Paths — non-hovered first */}
      {[...paths].sort((a,b)=>(hovered===b.d.id?-1:hovered===a.d.id?1:0)).map(({d,path,ex,ey})=>{
        const isHov=hovered===d.id;
        const col=d.color ? colorToHex(d.color) : DISC_TYPE_COLORS[d.type];
        return (
          <g key={d.id} style={{cursor:"pointer"}}
            onMouseEnter={()=>setHovered(d.id)} onMouseLeave={()=>setHovered(null)} onClick={()=>onClickDisc(d.id)}>
            <path d={path} fill="none" stroke={col} strokeWidth={isHov?2.5:1.5} opacity={isHov?1:0.55}/>
            <circle cx={ex} cy={ey} r={isHov?6:4} fill={col} stroke={strokeFor(col)} strokeWidth={1.5}/>
            {(showNames||isHov) && (
              <text x={ex+8} y={ey+4} fontSize={10} fill={col} fontWeight={isHov?"700":"500"}
                stroke="white" strokeWidth={3} paintOrder="stroke">{d.discName}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  red:"#ef4444", orange:"#f97316", yellow:"#ca8a04", green:"#16a34a",
  blue:"#2563eb", purple:"#7c3aed", pink:"#db2777", white:"#9ca3af",
  black:"#1f2937", grey:"#6b7280", gray:"#6b7280", teal:"#0d9488",
};
function colorToHex(color: string): string {
  return COLOR_MAP[color.toLowerCase()] ?? DISC_TYPE_COLORS["midrange"];
}
// All discs use a consistent white stroke — light colors are pre-darkened above
function strokeFor(_hex: string): string { return "white"; }

// ── Main component ────────────────────────────────────────────────────────────

type View = "scatter"|"flights";

export function BagChart({ discs, prefs={} }: { discs: BagDisc[]; prefs?: ChartPrefs }) {
  const [view, setView] = useState<View>("scatter");
  const [hovered, setHovered] = useState<string|null>(null);
  const [focused, setFocused] = useState<string|null>(null);
  const hoveredDisc = hovered ? discs.find(d=>d.id===hovered) : (focused ? discs.find(d=>d.id===focused) : null);
  const flipLateral = prefs.throwStyle==="LHBH" || prefs.throwStyle==="RHFH";
  const visibleDiscs = focused ? discs.filter(d=>d.id===focused) : discs;
  function handleClick(id: string) {
    if (focused === id) {
      setFocused(null);
      setView("scatter");
    } else {
      setFocused(id);
      setView("flights"); // Auto-switch to flights when clicking a disc
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        {(["scatter","flights"] as View[]).map(v=>(
          <button key={v} onClick={()=>{setView(v); if(focused) setFocused(null);}}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              view===v?"bg-forest-700 text-white":"bg-forest-100 text-forest-600 hover:bg-forest-200"
            }`}>
            {v==="scatter"?"📊 Stability":"✈️ Flight paths"}
          </button>
        ))}
      </div>

      {view==="scatter"
        ? <ScatterPlot discs={visibleDiscs} hovered={hovered} setHovered={setHovered} showNames={prefs.showNamesChart??false} onClickDisc={handleClick} focused={focused}/>
        : <FlightPaths discs={visibleDiscs} hovered={hovered} setHovered={setHovered} showNames={prefs.showNamesFlight??true} flipLateral={flipLateral} onClickDisc={handleClick} focused={focused}/>}
      {focused && (
        <p className="text-[11px] text-forest-500 text-center">
          Showing <strong>{discs.find(d=>d.id===focused)?.discName}</strong> only ·{" "}
          <button onClick={()=>{setFocused(null); setView("scatter");}} className="underline hover:text-forest-800">show all</button>
        </p>
      )}

      <div className="min-h-[22px]">
        {hoveredDisc ? (
          <p className="text-sm text-forest-800">
            <span className="w-2.5 h-2.5 rounded-full inline-block mr-1.5 align-middle"
              style={{backgroundColor: hoveredDisc.color?colorToHex(hoveredDisc.color):DISC_TYPE_COLORS[hoveredDisc.type]}}/>
            <strong>{hoveredDisc.discName}</strong>
            {hoveredDisc.manufacturer&&<span className="text-forest-400"> · {hoveredDisc.manufacturer}</span>}
            <span className="ml-2 tabular-nums text-forest-500 text-xs">
              {hoveredDisc.speed}/{hoveredDisc.glide??'—'}/{hoveredDisc.turn??'—'}/{hoveredDisc.fade??'—'}
              {hoveredDisc.weightG&&<span> · {hoveredDisc.weightG}g</span>}
            </span>
          </p>
        ):(
          <p className="text-xs text-forest-400">Hover a disc to see details</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {(Object.entries(DISC_TYPE_LABELS) as [keyof typeof DISC_TYPE_LABELS,string][]).map(([type,label])=>(
          <div key={type} className="flex items-center gap-1.5 text-xs text-forest-600">
            <span className="w-3 h-3 rounded-full inline-block" style={{backgroundColor:DISC_TYPE_COLORS[type]}}/>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
