"use client";
import { useState, useTransition } from "react";
import type { UserPrefs } from "@/lib/store";
import type { BagPrefs } from "@/components/BagSettings";
import { saveUserPrefsAction } from "@/app/bag/actions";
import { loadPrefs, savePrefs } from "@/components/BagSettings";

const THROW_STYLES = ["RHBH","LHBH","RHFH","LHFH"] as const;
const PLAY_STYLES: { value: string; label: string; hint: string }[] = [
  { value:"beginner",    label:"Learning",      hint:"working on basics" },
  { value:"flat",        label:"Flat & true",   hint:"let the disc do the work" },
  { value:"hyzer_flip",  label:"Hyzer flipper", hint:"flip to flat for distance" },
  { value:"anhyzer",     label:"Anhyzer/roller", hint:"prefer turnover shots" },
];

export function PlayerProfile({ initial }: { initial: UserPrefs }) {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<UserPrefs>(initial);
  const [saved, setSaved] = useState(false);
  const [pending, startT] = useTransition();

  function update(patch: Partial<UserPrefs>) {
    setPrefs(p => ({ ...p, ...patch }));
    setSaved(false);
  }

  function save() {
    startT(async () => {
      // Save to DB (persistent across devices)
      await saveUserPrefsAction(prefs);
      // Also sync to localStorage so client components pick it up immediately
      const local = loadPrefs();
      savePrefs({ ...local, throwStyle: prefs.throwStyle as BagPrefs["throwStyle"], maxDist: prefs.maxDistFt, playStyle: prefs.playStyle });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  // Compact summary line
  const summary = [
    prefs.throwStyle,
    PLAY_STYLES.find(s => s.value === prefs.playStyle)?.label ?? "—",
    `${prefs.maxDistFt}ft max`,
    prefs.yearsPlaying ? `${prefs.yearsPlaying}yr` : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="rounded-2xl border border-forest-100 bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-forest-50 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm">👤</span>
          <span className="text-xs font-semibold text-forest-700">Player profile</span>
          {!open && <span className="text-xs text-forest-400 truncate">· {summary}</span>}
        </div>
        <span className="text-forest-400 text-xs shrink-0 ml-2">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-forest-100 px-4 py-3 space-y-3">
          {/* Throw style */}
          <div>
            <label className="text-[10px] font-semibold text-forest-600 uppercase tracking-wide block mb-1">Throw style</label>
            <div className="flex gap-1 flex-wrap">
              {THROW_STYLES.map(s => (
                <button key={s} onClick={() => update({ throwStyle: s })}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${prefs.throwStyle === s ? "bg-forest-700 text-white" : "bg-forest-100 text-forest-600 hover:bg-forest-200"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Playing style */}
          <div>
            <label className="text-[10px] font-semibold text-forest-600 uppercase tracking-wide block mb-1">Playing tendency</label>
            <div className="grid grid-cols-2 gap-1">
              {PLAY_STYLES.map(s => (
                <button key={s.value} onClick={() => update({ playStyle: s.value })}
                  className={`text-left px-2.5 py-1.5 rounded-xl text-xs transition-colors ${prefs.playStyle === s.value ? "bg-forest-700 text-white" : "bg-forest-50 text-forest-700 hover:bg-forest-100 border border-forest-100"}`}>
                  <div className="font-semibold">{s.label}</div>
                  <div className={`text-[10px] ${prefs.playStyle === s.value ? "text-forest-200" : "text-forest-400"}`}>{s.hint}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Max distance */}
          <div>
            <label className="text-[10px] font-semibold text-forest-600 uppercase tracking-wide block mb-1">
              Max distance <span className="font-bold text-forest-800 normal-case">{prefs.maxDistFt} ft</span>
            </label>
            <input type="range" min={80} max={500} step={10} value={prefs.maxDistFt}
              onChange={e => update({ maxDistFt: Number(e.target.value) })}
              className="w-full accent-forest-600" />
            <div className="flex justify-between text-[10px] text-forest-400 mt-0.5">
              <span>80 beginner</span><span>300 average</span><span>500 pro</span>
            </div>
          </div>

          {/* Years playing */}
          <div>
            <label className="text-[10px] font-semibold text-forest-600 uppercase tracking-wide block mb-1">Years playing</label>
            <input type="number" min={0} max={50} value={prefs.yearsPlaying ?? ""} placeholder="optional"
              onChange={e => update({ yearsPlaying: e.target.value ? Number(e.target.value) : undefined })}
              className="input-pill text-sm w-24 text-center" />
          </div>

          <button onClick={save} disabled={pending}
            className={`btn-primary w-full text-sm ${saved ? "bg-green-600 hover:bg-green-700" : ""}`}>
            {pending ? "Saving…" : saved ? "Saved ✓" : "Save profile"}
          </button>
        </div>
      )}
    </div>
  );
}
