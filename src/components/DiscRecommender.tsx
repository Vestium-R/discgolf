"use client";
import { useState, useTransition } from "react";
import { recommendDiscAction } from "@/app/bag/ai-analyze";
import { AI_FACTORS } from "@/lib/ai-factors";
import { AIFactorsBadge } from "@/components/AIFactorsBadge";
import type { DiscType } from "@/lib/types";
import { DISC_TYPE_LABELS } from "@/lib/types";

const TYPE_ORDER: (DiscType | "")[] = ["", "distance_driver", "fairway_driver", "midrange", "putter"];
const STAB_OPTIONS = [
  { value: "",        label: "Any stability" },
  { value: "os",     label: "Overstable (reliable fade)" },
  { value: "neutral",label: "Neutral (straight flight)" },
  { value: "us",     label: "Understable (turn/flip)" },
];

export function DiscRecommender() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("");
  const [stab, setStab] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startT] = useTransition();

  function go() {
    setResult(null); setErr(null);
    startT(async () => {
      const res = await recommendDiscAction({ type: type as DiscType | "", stab, brand, description });
      if (res.ok) setResult(res.text); else setErr(res.error);
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary w-full text-sm">
        🛒 Recommend a disc for me
      </button>
    );
  }

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <h3 className="font-display font-bold text-forest-800">Recommend a disc</h3>
          <AIFactorsBadge factors={AI_FACTORS.discRecommender} direction="down" />
        </div>
        <button onClick={() => { setOpen(false); setResult(null); }}
          className="text-xs text-forest-400 hover:text-forest-700">✕</button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="input-pill text-sm">
            {TYPE_ORDER.map(t => (
              <option key={t} value={t}>{t ? DISC_TYPE_LABELS[t as DiscType] : "Any type"}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">Stability</label>
          <select value={stab} onChange={e => setStab(e.target.value)} className="input-pill text-sm">
            {STAB_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs font-semibold text-forest-700 block mb-1">
            Brand preference <span className="font-normal text-forest-400">(optional)</span>
          </label>
          <input value={brand} onChange={e => setBrand(e.target.value)}
            placeholder="e.g. Innova, Discraft, Kastaplast, or leave blank"
            className="input-pill text-sm" />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-semibold text-forest-700 block mb-1">
            What gap are you filling? <span className="font-normal text-forest-400">(optional but helps)</span>
          </label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="e.g. headwind utility driver, beginner-friendly midrange, understable roller disc, something for wooded courses…"
            rows={2} className="input-pill text-sm resize-none" />
        </div>
      </div>

      <button onClick={go} disabled={pending} className="btn-primary w-full">
        {pending ? "Finding discs…" : "✨ Find me a disc"}
      </button>

      {err && <p className="text-sm text-red-700">{err}</p>}

      {pending && (
        <div className="space-y-2 animate-pulse">
          {[1, .8, .9, .7, .85, .6].map((w, i) => (
            <div key={i} className="h-2.5 bg-forest-100 rounded" style={{ width: `${w * 100}%` }} />
          ))}
        </div>
      )}

      {result && (
        <div className="rounded-xl bg-forest-50 border border-forest-100 p-3 space-y-2">
          {result.split("\n").filter(Boolean).map((line, i) => (
            <p key={i} className="text-sm text-forest-800 leading-relaxed">{line}</p>
          ))}
        </div>
      )}
    </div>
  );
}
