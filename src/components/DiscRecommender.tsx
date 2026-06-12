"use client";
import { useState, useTransition } from "react";
import { ShoppingCart } from "lucide-react";
import { recommendDiscAction } from "@/app/bag/ai-analyze";
import { Disclosure } from "@/components/Disclosure";
import { AI_FACTORS } from "@/lib/ai-factors";
import { AIFactorsBadge } from "@/components/AIFactorsBadge";
import type { DiscType } from "@/lib/types";
import { DISC_TYPE_LABELS } from "@/lib/types";
import { DISC_DB } from "@/lib/discs-db";
import { getPlasticsForManufacturer } from "@/lib/plastics-db";

const TYPE_ORDER: (DiscType | "")[] = ["", "distance_driver", "fairway_driver", "midrange", "putter"];
const STAB_OPTIONS = [
  { value: "",        label: "Any stability" },
  { value: "os",     label: "Overstable (reliable fade)" },
  { value: "neutral",label: "Neutral (straight flight)" },
  { value: "us",     label: "Understable (turn/flip)" },
];

// Sorted unique manufacturers from the disc database
const BRANDS = [...new Set(DISC_DB.map(d => d.manufacturer))].sort();

export function DiscRecommender() {
  const [type, setType] = useState<string>("");
  const [stab, setStab] = useState("");
  const [brand, setBrand] = useState("");
  const [plastic, setPlastic] = useState("");
  const [description, setDescription] = useState("");

  const availablePlastics = brand ? getPlasticsForManufacturer(brand) : [];
  const [result, setResult] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startT] = useTransition();

  function go() {
    setResult(null); setErr(null);
    startT(async () => {
      const res = await recommendDiscAction({ type: type as DiscType | "", stab, brand, plastic, description });
      if (res.ok) setResult(res.text); else setErr(res.error);
    });
  }

  return (
    <Disclosure
      icon={<ShoppingCart size={16} />}
      title="Recommend a disc"
      summary="Find your next disc to buy"
    >
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
        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">
            Brand <span className="font-normal text-forest-400">(optional)</span>
          </label>
          <select value={brand}
            onChange={e => { setBrand(e.target.value); setPlastic(""); }}
            className="input-pill text-sm">
            <option value="">Any brand</option>
            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">
            Plastic <span className="font-normal text-forest-400">(optional)</span>
          </label>
          {availablePlastics.length > 0 ? (
            <select value={plastic} onChange={e => setPlastic(e.target.value)} className="input-pill text-sm">
              <option value="">Any plastic</option>
              {availablePlastics.map(p => (
                <option key={p.name} value={p.name}>
                  {p.name} {p.stabilityOffset > 0 ? "↑OS" : p.stabilityOffset < 0 ? "↓US" : "·"} {"★".repeat(p.durability)}{"☆".repeat(5-p.durability)}
                </option>
              ))}
            </select>
          ) : (
            <select disabled className="input-pill text-sm opacity-40">
              <option>Pick a brand first</option>
            </select>
          )}
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

      <span className="flex items-center gap-1">
        <button onClick={go} disabled={pending} className="btn-primary flex-1">
          {pending ? "Finding discs…" : "Find me a disc"}
        </button>
        <AIFactorsBadge factors={AI_FACTORS.discRecommender} />
      </span>

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
    </Disclosure>
  );
}
