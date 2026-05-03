"use client";
import { useState, useTransition } from "react";
import type { BagDisc } from "@/lib/types";
import { analyzeBagDiscsAction } from "@/app/bag/ai-analyze";
import { loadPrefs } from "@/components/BagSettings";
import type { UserPrefs } from "@/lib/store";
import { AI_FACTORS } from "@/lib/ai-factors";
import { AIFactorsBadge } from "@/components/AIFactorsBadge";

export function BagAnalysis({ discs, serverPrefs }: { discs: BagDisc[]; serverPrefs?: UserPrefs }) {
  const [open, setOpen] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const localPrefs = typeof window !== "undefined" ? loadPrefs() : {} as any;
  const maxDist = serverPrefs?.maxDistFt ?? localPrefs.maxDist ?? 300;
  const playStyle = serverPrefs?.playStyle ?? localPrefs.playStyle ?? "flat";
  const yearsPlaying = (serverPrefs as any)?.yearsPlaying ?? (localPrefs as any)?.yearsPlaying;

  function analyze() {
    setAnalysis(null);
    setError(null);
    startTransition(async () => {
      const res = await analyzeBagDiscsAction(discs, maxDist, playStyle, "RHBH", yearsPlaying);
      if (res.ok) setAnalysis(res.text);
      else setError(res.error);
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary w-full py-3 text-base">
        ✨ Analyse your bag
      </button>
    );
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-bold text-forest-800">Bag analysis</h3>
          <AIFactorsBadge factors={AI_FACTORS.bagAnalysis} direction="down" />
        </div>
        <button onClick={() => setOpen(false)} className="text-xs text-forest-400">✕</button>
      </div>

      {!analysis && !pending && (
        <p className="text-sm text-forest-600">
          Get AI feedback on your bag setup, gaps, and recommendations.
        </p>
      )}

      {pending && (
        <div className="space-y-2">
          {[1, 0.9, 0.8, 0.85, 0.95].map((w, i) => (
            <div key={i} className="h-2.5 bg-forest-100 rounded animate-pulse" style={{ width: `${w * 100}%` }} />
          ))}
        </div>
      )}

      {analysis && (
        <div className="rounded-xl bg-forest-50 border border-forest-100 p-4 space-y-2">
          {analysis.split("\n").filter(Boolean).map((line, i) => (
            <p key={i} className="text-sm text-forest-800 leading-relaxed">{line}</p>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-700 bg-red-50 p-3 rounded">{error}</p>
      )}

      {!analysis && !pending && (
        <button onClick={analyze} className="btn-primary w-full text-sm">
          Run analysis
        </button>
      )}

      {analysis && !pending && (
        <button onClick={() => setAnalysis(null)} className="btn-secondary w-full text-sm">
          Clear
        </button>
      )}
    </div>
  );
}
