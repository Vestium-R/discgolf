"use client";
import { useState } from "react";
import type { BagDisc } from "@/lib/types";
import { DISC_TYPE_COLORS, DISC_TYPE_LABELS } from "@/lib/types";

// Chart dimensions
const W = 580, H = 340;
const PL = 46, PT = 16, PR = 16, PB = 36;
const PW = W - PL - PR;
const PH = H - PT - PB;

const SPEED_MIN = 1, SPEED_MAX = 14;
const STAB_MIN = -5, STAB_MAX = 6;

function cx(speed: number) {
  return PL + ((speed - SPEED_MIN) / (SPEED_MAX - SPEED_MIN)) * PW;
}
function cy(stab: number) {
  return PT + ((STAB_MAX - stab) / (STAB_MAX - STAB_MIN)) * PH;
}

export function BagChart({ discs }: { discs: BagDisc[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const plotted = discs.filter((d) => d.speed != null);
  const hoveredDisc = hovered ? plotted.find((d) => d.id === hovered) : null;

  return (
    <div className="space-y-2">
      <div className="relative overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[320px] rounded-xl border border-forest-100 bg-white">
          {/* Stability zone backgrounds */}
          <rect x={PL} y={PT} width={PW} height={cy(1) - PT} fill="#fee2e2" opacity={0.45} />
          <rect x={PL} y={cy(1)} width={PW} height={cy(-1) - cy(1)} fill="#fef9c3" opacity={0.45} />
          <rect x={PL} y={cy(-1)} width={PW} height={PT + PH - cy(-1)} fill="#dcfce7" opacity={0.45} />

          {/* Horizontal grid lines */}
          {[-4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((s) => (
            <line key={s} x1={PL} y1={cy(s)} x2={PL + PW} y2={cy(s)}
              stroke="#d1d5db" strokeWidth={s === 0 ? 1.5 : 0.5} />
          ))}

          {/* Vertical grid lines */}
          {[2, 4, 6, 8, 10, 12, 14].map((sp) => (
            <line key={sp} x1={cx(sp)} y1={PT} x2={cx(sp)} y2={PT + PH}
              stroke="#d1d5db" strokeWidth={0.5} />
          ))}

          {/* Zone labels */}
          <text x={PL + 4} y={PT + 11} fontSize={9} fill="#ef4444" opacity={0.8} fontWeight="600">OVERSTABLE</text>
          <text x={PL + 4} y={cy(-1) + 11} fontSize={9} fill="#16a34a" opacity={0.8} fontWeight="600">UNDERSTABLE</text>

          {/* X-axis labels */}
          {[2, 4, 6, 8, 10, 12, 14].map((sp) => (
            <text key={sp} x={cx(sp)} y={H - 8} textAnchor="middle" fontSize={10} fill="#6b7280">{sp}</text>
          ))}
          <text x={PL + PW / 2} y={H - 1} textAnchor="middle" fontSize={10} fill="#374151" fontWeight="500">Speed</text>

          {/* Y-axis labels */}
          {[-4, -2, 0, 2, 4].map((s) => (
            <text key={s} x={PL - 4} y={cy(s) + 4} textAnchor="end" fontSize={10} fill="#6b7280">
              {s > 0 ? `+${s}` : s}
            </text>
          ))}
          <text x={11} y={PT + PH / 2} textAnchor="middle" fontSize={10} fill="#374151" fontWeight="500"
            transform={`rotate(-90 11 ${PT + PH / 2})`}>Stability</text>

          {/* Chart border */}
          <rect x={PL} y={PT} width={PW} height={PH} fill="none" stroke="#e5e7eb" strokeWidth={1} />

          {/* Disc dots */}
          {plotted.map((d) => {
            const stab = (d.turn ?? 0) + (d.fade ?? 0);
            const x = cx(d.speed);
            const y = cy(stab);
            const color = DISC_TYPE_COLORS[d.type];
            const isHov = hovered === d.id;
            return (
              <g key={d.id} style={{ cursor: "pointer" }}
                onMouseEnter={() => setHovered(d.id)}
                onMouseLeave={() => setHovered(null)}
                onTouchStart={() => setHovered(d.id)}
              >
                <circle cx={x} cy={y} r={isHov ? 9 : 7}
                  fill={color} stroke="white" strokeWidth={2} opacity={isHov ? 1 : 0.85} />
                <text x={x} y={y + 4} textAnchor="middle" fontSize={8} fill="white" fontWeight="700" pointerEvents="none">
                  {d.speed}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hover tooltip */}
      <div className="min-h-[28px]">
        {hoveredDisc ? (
          <p className="text-sm text-forest-800">
            <strong>{hoveredDisc.discName}</strong>
            {hoveredDisc.manufacturer && <span className="text-forest-500"> · {hoveredDisc.manufacturer}</span>}
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
          <div key={type} className="flex items-center gap-1.5 text-xs text-forest-700">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: DISC_TYPE_COLORS[type] }} />
            {label}
          </div>
        ))}
        <div className="flex items-center gap-3 ml-auto text-xs text-forest-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-red-100" /> Overstable</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-yellow-100" /> Neutral</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-green-100" /> Understable</span>
        </div>
      </div>
    </div>
  );
}
