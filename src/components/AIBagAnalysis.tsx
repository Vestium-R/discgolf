"use client";
import { useState, useTransition } from "react";
import { analyzeBagAction } from "@/app/bag/ai-analyze";

export function AIBagAnalysis({ discCount }: { discCount: number }) {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function analyze() {
    startTransition(async () => {
      setResult(null);
      setError(null);
      const res = await analyzeBagAction();
      if (res.ok) setResult(res.text);
      else setError(res.error);
    });
  }

  if (discCount < 3) return null;

  return (
    <section className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-forest-800">AI bag analysis</h3>
        <button
          onClick={analyze}
          disabled={pending}
          className="btn-secondary text-xs py-1.5 px-3"
        >
          {pending ? "Analysing…" : result ? "Re-analyse" : "✨ Analyse my bag"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-700">{error}</p>
      )}

      {pending && (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 bg-forest-100 rounded w-full" />
          <div className="h-3 bg-forest-100 rounded w-5/6" />
          <div className="h-3 bg-forest-100 rounded w-4/6" />
          <div className="h-3 bg-forest-100 rounded w-full" />
          <div className="h-3 bg-forest-100 rounded w-3/4" />
        </div>
      )}

      {result && (
        <div className="prose prose-sm max-w-none text-forest-800 space-y-2">
          {result.split("\n\n").filter(Boolean).map((para, i) => (
            <p key={i} className="text-sm leading-relaxed">{para}</p>
          ))}
        </div>
      )}

      {!result && !pending && !error && (
        <p className="text-xs text-forest-500">
          Claude will analyse your stability distribution, identify gaps, flag redundancies, and recommend specific discs by name.
        </p>
      )}
    </section>
  );
}
