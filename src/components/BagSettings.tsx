"use client";
import { useState, useEffect } from "react";

export type BagPrefs = {
  throwStyle: "RHBH" | "LHFH" | "RHFH" | "LHBH";
  showNamesChart: boolean;
  showNamesFlight: boolean;
  distanceUnit: "ft" | "m";
  maxDist: number;
  playStyle?: string;
};

const DEFAULTS: BagPrefs = {
  throwStyle: "RHBH",
  showNamesChart: true,
  showNamesFlight: true,
  distanceUnit: "ft",
  maxDist: 300,
};

const KEY = "bag-prefs";

export function loadPrefs(): BagPrefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function savePrefs(p: BagPrefs) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function BagSettings({ onChange }: { onChange: (p: BagPrefs) => void }) {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<BagPrefs>(DEFAULTS);

  useEffect(() => {
    const p = loadPrefs();
    setPrefs(p);
    onChange(p);
  }, []);  // eslint-disable-line

  function update(patch: Partial<BagPrefs>) {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    savePrefs(next);
    onChange(next);
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-forest-500 hover:text-forest-800 flex items-center gap-1 transition-colors"
      >
        ⚙ Bag settings {open ? "▲" : "▼"}
      </button>

      {open && (
        <div className="mt-3 card p-4 space-y-4">
          <h4 className="text-sm font-semibold text-forest-800">Display settings</h4>

          {/* Throwing style */}
          <div>
            <label className="text-xs font-semibold text-forest-700 block mb-1">Throwing style</label>
            <div className="flex gap-1 flex-wrap">
              {(["RHBH", "RHFH", "LHBH", "LHFH"] as BagPrefs["throwStyle"][]).map((s) => (
                <button key={s} onClick={() => update({ throwStyle: s })}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    prefs.throwStyle === s ? "bg-forest-700 text-white" : "bg-forest-100 text-forest-600 hover:bg-forest-200"
                  }`}>
                  {s}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-forest-400 mt-1">Affects flight path direction on the chart</p>
          </div>

          {/* Distance unit */}
          <div>
            <label className="text-xs font-semibold text-forest-700 block mb-1">Distance unit</label>
            <div className="flex gap-1">
              {(["ft", "m"] as BagPrefs["distanceUnit"][]).map((u) => (
                <button key={u} onClick={() => update({ distanceUnit: u })}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    prefs.distanceUnit === u ? "bg-forest-700 text-white" : "bg-forest-100 text-forest-600 hover:bg-forest-200"
                  }`}>
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Max distance */}
          <div>
            <label className="text-xs font-semibold text-forest-700 block mb-1">
              My max distance: <span className="tabular-nums font-bold text-forest-900">{prefs.maxDist} ft</span>
            </label>
            <input type="range" min={100} max={500} step={10} value={prefs.maxDist}
              onChange={e => update({ maxDist: Number(e.target.value) })}
              className="w-full accent-forest-600" />
            <div className="flex justify-between text-[10px] text-forest-400 mt-0.5">
              <span>100 (beginner)</span><span>300 (avg)</span><span>500 (pro)</span>
            </div>
            <p className="text-[10px] text-forest-400 mt-1">
              Used to filter out discs that need more arm speed than you have — a speed-14 driver at 200ft just rolls over.
            </p>
          </div>

          {/* Disc name toggles */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-forest-700 block">Disc labels</label>
            <Toggle
              label="Show names on stability chart"
              value={prefs.showNamesChart}
              onChange={(v) => update({ showNamesChart: v })}
            />
            <Toggle
              label="Show names on flight path chart"
              value={prefs.showNamesFlight}
              onChange={(v) => update({ showNamesFlight: v })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
      <span className="text-xs text-forest-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${value ? "bg-forest-600" : "bg-forest-200"}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform mt-0.5 ${value ? "translate-x-4.5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}
