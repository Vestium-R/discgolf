"use client";
import { useState, useTransition } from "react";
import type { BagDisc } from "@/lib/types";
import { DISC_TYPE_LABELS, DISC_TYPE_COLORS } from "@/lib/types";
import { recommendThrowAction } from "@/app/bag/ai-analyze";

type Wind =
  | "calm"
  | "light-headwind"
  | "strong-headwind"
  | "light-tailwind"
  | "strong-tailwind"
  | "crosswind-right"
  | "crosswind-left";

const WIND_OPTIONS: { value: Wind; label: string; hint: string }[] = [
  { value: "calm",            label: "Calm",               hint: "< 5 mph" },
  { value: "light-headwind",  label: "Light headwind",     hint: "5–12 mph" },
  { value: "strong-headwind", label: "Strong headwind",    hint: "13+ mph" },
  { value: "light-tailwind",  label: "Light tailwind",     hint: "5–12 mph" },
  { value: "strong-tailwind", label: "Strong tailwind",    hint: "13+ mph" },
  { value: "crosswind-right", label: "Right crosswind",    hint: "left→right" },
  { value: "crosswind-left",  label: "Left crosswind",     hint: "right→left" },
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

export function WhatToThrow({ discs }: { discs: BagDisc[] }) {
  const [open, setOpen] = useState(false);
  const [dist, setDist] = useState(200);
  const [wind, setWind] = useState<Wind>("calm");
  const [aiText, setAiText] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function ask() {
    setAiText(null);
    setErr(null);
    startTransition(async () => {
      const res = await recommendThrowAction(dist, WIND_DESC[wind]);
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
            Distance: <span className="tabular-nums font-bold">{dist} ft</span>
          </label>
          <input type="range" min={60} max={500} step={10} value={dist}
            onChange={(e) => { setDist(Number(e.target.value)); setAiText(null); }}
            className="w-full accent-forest-600" />
          <div className="flex justify-between text-[10px] text-forest-400 mt-0.5">
            <span>60ft</span><span>300ft</span><span>500ft</span>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">Wind</label>
          <div className="space-y-0.5">
            {WIND_OPTIONS.map((w) => (
              <label key={w.value}
                className={`flex items-center gap-1.5 text-xs cursor-pointer px-2 py-1 rounded-lg transition-colors ${wind === w.value ? "bg-forest-100 font-semibold text-forest-800" : "text-forest-600 hover:bg-forest-50"}`}>
                <input type="radio" name="wind" value={w.value} checked={wind === w.value}
                  onChange={() => { setWind(w.value); setAiText(null); }}
                  className="accent-forest-600 shrink-0" />
                <span>{w.label}</span>
                <span className="text-forest-400 text-[10px]">{w.hint}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <button onClick={ask} disabled={pending}
        className="btn-primary w-full">
        {pending ? "Asking AI…" : "✨ Get AI recommendation"}
      </button>

      {err && <p className="text-sm text-red-700">{err}</p>}

      {pending && (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 bg-forest-100 rounded w-full" />
          <div className="h-3 bg-forest-100 rounded w-5/6" />
          <div className="h-3 bg-forest-100 rounded w-4/6" />
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
  );
}
