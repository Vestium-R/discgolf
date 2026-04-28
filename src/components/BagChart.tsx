"use client";
import { useState } from "react";
import type { BagDisc } from "@/lib/types";
import { DISC_TYPE_COLORS, DISC_TYPE_LABELS } from "@/lib/types";

// ── Shared constants ─────────────────────────────────────────────────────────

const W = 580, H = 360;
const PL = 52, PT = 16, PR = 16, PB = 40;
const PW = W - PL - PR, PH = H - PT - PB;

const DISC_COLOR = (type: BagDisc["type"]) => DISC_TYPE_COLORS[type];

// ── Scatter plot ─────────────────────────────────────────────────────────────
// X: Stability (turn+fade). Left = overstable (+6), Right = understable (-5)
// Y: Speed. Bottom = 0, Top = 14

const STAB_MAX = 6, STAB_MIN = -5; // left to right: max stab → min stab
const SPD_MIN = 0, SPD_MAX = 14;   // bottom to top

function scatX(stab: number) {
  // overstable (high stab) on left, understable (low stab) on right
  return PL + ((STAB_MAX - stab) / (STAB_MAX - STAB_MIN)) * PW;
}
function scatY(speed: number) {
  return PT + PH - ((speed - SPD_MIN) / (SPD_MAX - SPD_MIN)) * PH;
}

function ScatterPlot({ discs, hovered, setHovered }: {
  discs: BagDisc[];
  hovered: string | null;
  setHovered: (id: string | null) => void;
}) {
  const stabTicks = [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
  const spdTicks = [2, 4, 6, 8, 10, 12, 14];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[300px] rounded-xl border border-forest-100 bg-white">
      {/* Zone bands (X axis = stability) */}
      {/* Left = overstable */}
      <rect x={PL} y={PT} width={scatX(1) - PL} height={PH} fill="#fee2e2" opacity={0.4} />
      {/* Middle = neutral */}
      <rect x={scatX(1)} y={PT} width={scatX(-1) - scatX(1)} height={PH} fill="#fef9c3" opacity={0.4} />
      {/* Right = understable */}
      <rect x={scatX(-1)} y={PT} width={PL + PW - scatX(-1)} height={PH} fill="#dcfce7" opacity={0.4} />

      {/* Zone labels */}
      <text x={PL + 4} y={PT + 12} fontSize={9} fill="#ef4444" opacity={0.8} fontWeight="600">OVERSTABLE</text>
      <text x={scatX(-1) + 4} y={PT + 12} fontSize={9} fill="#16a34a" opacity={0.8} fontWeight="600">UNDERSTABLE</text>

      {/* Stability grid lines */}
      {stabTicks.map((s) => (
        <line key={s} x1={scatX(s)} y1={PT} x2={scatX(s)} y2={PT + PH}
          stroke="#d1d5db" strokeWidth={s === 0 ? 1.5 : 0.5} />
      ))}

      {/* Speed grid lines */}
      {spdTicks.map((sp) => (
        <line key={sp} x1={PL} y1={scatY(sp)} x2={PL + PW} y2={scatY(sp)}
          stroke="#d1d5db" strokeWidth={0.5} />
      ))}

      {/* X-axis labels (stability) */}
      {stabTicks.map((s) => (
        <text key={s} x={scatX(s)} y={H - 8} textAnchor="middle" fontSize={10} fill="#6b7280">
          {s > 0 ? `+${s}` : s}
        </text>
      ))}
      <text x={PL + PW / 2} y={H - 1} textAnchor="middle" fontSize={10} fill="#374151" fontWeight="500">
        Stability (turn + fade)  ← Overstable · Understable →
      </text>

      {/* Y-axis labels (speed) */}
      {spdTicks.map((sp) => (
        <text key={sp} x={PL - 4} y={scatY(sp) + 4} textAnchor="end" fontSize={10} fill="#6b7280">{sp}</text>
      ))}
      <text x={11} y={PT + PH / 2} textAnchor="middle" fontSize={10} fill="#374151" fontWeight="500"
        transform={`rotate(-90 11 ${PT + PH / 2})`}>Speed</text>

      {/* Border */}
      <rect x={PL} y={PT} width={PW} height={PH} fill="none" stroke="#e5e7eb" strokeWidth={1} />

      {/* Discs */}
      {discs.map((d) => {
        const stab = (d.turn ?? 0) + (d.fade ?? 0);
        const x = scatX(stab);
        const y = scatY(d.speed);
        const isHov = hovered === d.id;
        return (
          <g key={d.id} style={{ cursor: "pointer" }}
            onMouseEnter={() => setHovered(d.id)}
            onMouseLeave={() => setHovered(null)}
            onTouchStart={() => setHovered(d.id)}
          >
            <circle cx={x} cy={y} r={isHov ? 10 : 7}
              fill={DISC_COLOR(d.type)} stroke="white" strokeWidth={2} opacity={isHov ? 1 : 0.85} />
            <text x={x} y={y + 3.5} textAnchor="middle" fontSize={7} fill="white" fontWeight="700" pointerEvents="none">
              {d.speed}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Flight path ───────────────────────────────────────────────────────────────
// Top-down view. Disc thrown from bottom-center.
// Forward = up. Right = right. Fade goes left, turn (negative) goes right.

const FW = 580, FH = 360;
const FPL = 20, FPT = 16, FPR = 20, FPB = 36;
const FPW = FW - FPL - FPR, FPH = FH - FPT - FPB;

function flightPath(speed: number, turn: number, fade: number) {
  const dist = speed * 10; // forward distance (in abstract units)
  // Lateral positions along the flight:
  // turn control: negative turn → right (+X), fade: positive fade → left (-X)
  const ctrlX = -turn * 5;                         // peak lateral at ~1/3 flight
  const endX  = -(turn * 3) + (-fade * 8);         // landing position
  // Cubic bezier points (in abstract coords):
  // x = lateral (positive = right), y = forward distance
  const pts: { x: number; y: number }[] = [];
  for (let t = 0; t <= 1; t += 0.02) {
    const mt = 1 - t;
    const bx = 3 * mt * mt * t * ctrlX + 3 * mt * t * t * (ctrlX * 0.5 + endX * 0.5) + t * t * t * endX;
    const by = t * dist;
    pts.push({ x: bx, y: by });
  }
  return { pts, dist, endX };
}

function FlightPaths({ discs, hovered, setHovered }: {
  discs: BagDisc[];
  hovered: string | null;
  setHovered: (id: string | null) => void;
}) {
  if (discs.length === 0) return null;

  // Compute paths
  const paths = discs.map((d) => ({
    disc: d,
    ...flightPath(d.speed, d.turn ?? 0, d.fade ?? 0),
  }));

  // Find bounding box for scaling
  const allX = paths.flatMap((p) => p.pts.map((pt) => pt.x));
  const allY = paths.flatMap((p) => p.pts.map((pt) => pt.y));
  const xMin = Math.min(...allX) - 5;
  const xMax = Math.max(...allX) + 5;
  const yMax = Math.max(...allY) + 5;

  const toSvgX = (x: number) => FPL + ((x - xMin) / (xMax - xMin)) * FPW;
  const toSvgY = (y: number) => FPT + FPH - (y / yMax) * FPH; // forward = up

  const centerX = toSvgX(0);

  return (
    <svg viewBox={`0 0 ${FW} ${FH}`} className="w-full min-w-[300px] rounded-xl border border-forest-100 bg-white">
      {/* Center line */}
      <line x1={centerX} y1={FPT} x2={centerX} y2={FPT + FPH} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="4 4" />

      {/* Labels */}
      <text x={FPL + 2} y={FPT + FPH - 4} fontSize={9} fill="#9ca3af">LEFT</text>
      <text x={FPL + FPW - 2} y={FPT + FPH - 4} textAnchor="end" fontSize={9} fill="#9ca3af">RIGHT</text>
      <text x={centerX} y={FPT + 12} textAnchor="middle" fontSize={9} fill="#9ca3af">← RHBH view →</text>

      {/* Throw origin */}
      <circle cx={centerX} cy={FPT + FPH} r={4} fill="#374151" />

      {/* Flight paths */}
      {paths.map(({ disc, pts, endX }) => {
        const isHov = hovered === disc.id;
        const color = DISC_COLOR(disc.type);
        const d_attr = pts.map((p, i) =>
          `${i === 0 ? "M" : "L"} ${toSvgX(p.x).toFixed(1)} ${toSvgY(p.y).toFixed(1)}`
        ).join(" ");
        const ex = toSvgX(endX);
        const ey = toSvgY(pts[pts.length - 1]?.y ?? 0);
        return (
          <g key={disc.id} style={{ cursor: "pointer" }}
            onMouseEnter={() => setHovered(disc.id)}
            onMouseLeave={() => setHovered(null)}
            onTouchStart={() => setHovered(disc.id)}
          >
            <path d={d_attr} fill="none" stroke={color}
              strokeWidth={isHov ? 2.5 : 1.5} opacity={isHov ? 1 : 0.6} />
            <circle cx={ex} cy={ey} r={isHov ? 6 : 4} fill={color} stroke="white" strokeWidth={1.5} />
            {isHov && (
              <text x={ex + 8} y={ey + 4} fontSize={11} fill={color} fontWeight="600">{disc.discName}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Main BagChart component ───────────────────────────────────────────────────

type View = "scatter" | "flights";

export function BagChart({ discs }: { discs: BagDisc[] }) {
  const [view, setView] = useState<View>("scatter");
  const [hovered, setHovered] = useState<string | null>(null);
  const hoveredDisc = hovered ? discs.find((d) => d.id === hovered) : null;

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <div className="flex gap-1">
        {(["scatter", "flights"] as View[]).map((v) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              view === v ? "bg-forest-700 text-white" : "bg-forest-100 text-forest-600 hover:bg-forest-200"
            }`}>
            {v === "scatter" ? "📊 Stability chart" : "✈️ Flight paths"}
          </button>
        ))}
      </div>

      {view === "scatter"
        ? <ScatterPlot discs={discs} hovered={hovered} setHovered={setHovered} />
        : <FlightPaths discs={discs} hovered={hovered} setHovered={setHovered} />}

      {/* Hover info */}
      <div className="min-h-[24px]">
        {hoveredDisc ? (
          <p className="text-sm text-forest-800">
            <span className="w-2.5 h-2.5 rounded-full inline-block mr-1.5 align-middle"
              style={{ backgroundColor: DISC_COLOR(hoveredDisc.type) }} />
            <strong>{hoveredDisc.discName}</strong>
            {hoveredDisc.manufacturer && <span className="text-forest-400"> · {hoveredDisc.manufacturer}</span>}
            <span className="ml-2 tabular-nums text-forest-600">
              {hoveredDisc.speed} / {hoveredDisc.glide ?? "—"} / {hoveredDisc.turn ?? "—"} / {hoveredDisc.fade ?? "—"}
            </span>
          </p>
        ) : (
          <p className="text-xs text-forest-400">Hover a disc to see details</p>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {(Object.entries(DISC_TYPE_LABELS) as [keyof typeof DISC_TYPE_LABELS, string][]).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs text-forest-600">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: DISC_TYPE_COLORS[type] }} />
            {label}
          </div>
        ))}
        {view === "scatter" && (
          <div className="flex items-center gap-2 ml-auto text-xs text-forest-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block bg-red-100" /> OS</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block bg-yellow-100" /> Neutral</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm inline-block bg-green-100" /> US</span>
          </div>
        )}
      </div>
    </div>
  );
}
