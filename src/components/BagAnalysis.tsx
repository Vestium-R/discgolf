"use client";
import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import type { BagDisc } from "@/lib/types";
import { analyzeBagDiscsAction, analyzeBagFollowUpAction } from "@/app/bag/ai-analyze";
import { loadPrefs } from "@/components/BagSettings";
import type { UserPrefs } from "@/lib/store";
import { AI_FACTORS } from "@/lib/ai-factors";
import { AIFactorsBadge } from "@/components/AIFactorsBadge";
import { Disclosure } from "@/components/Disclosure";

const FOLLOW_UPS = [
  { key: "unbag",     label: "What disc should I unbag?" },
  { key: "storage",   label: "What storage disc should I bag?" },
  { key: "versatile", label: "What's my most versatile disc?" },
  { key: "gap",       label: "What type am I missing?" },
] as const;

export function BagAnalysis({
  discs,
  storageDiscs = [],
  serverPrefs,
}: {
  discs: BagDisc[];
  storageDiscs?: BagDisc[];
  serverPrefs?: UserPrefs;
}) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [followUpAnswer, setFollowUpAnswer] = useState<string | null>(null);
  const [followUpError, setFollowUpError] = useState<string | null>(null);
  const [activeFollowUp, setActiveFollowUp] = useState<string | null>(null);
  const [followUpPending, startFollowUpTransition] = useTransition();

  const localPrefs = typeof window !== "undefined" ? loadPrefs() : {} as any;
  const maxDist = serverPrefs?.maxDistFt ?? localPrefs.maxDist ?? 300;
  const playStyle = serverPrefs?.playStyle ?? localPrefs.playStyle ?? "flat";
  const throwStyle = serverPrefs?.throwStyle ?? localPrefs.throwStyle ?? "RHBH";
  const yearsPlaying = (serverPrefs as any)?.yearsPlaying ?? (localPrefs as any)?.yearsPlaying;

  function analyze() {
    setAnalysis(null);
    setError(null);
    setFollowUpAnswer(null);
    setFollowUpError(null);
    setActiveFollowUp(null);
    startTransition(async () => {
      const res = await analyzeBagDiscsAction(discs, maxDist, playStyle, throwStyle, yearsPlaying);
      if (res.ok) setAnalysis(res.text);
      else setError(res.error);
    });
  }

  function askFollowUp(key: string) {
    if (!analysis) return;
    setActiveFollowUp(key);
    setFollowUpAnswer(null);
    setFollowUpError(null);
    startFollowUpTransition(async () => {
      const res = await analyzeBagFollowUpAction(
        discs, storageDiscs, maxDist, playStyle, throwStyle, yearsPlaying, analysis, key,
      );
      if (res.ok) setFollowUpAnswer(res.text);
      else setFollowUpError(res.error);
    });
  }

  return (
    <Disclosure
      icon={<Sparkles size={16} />}
      title="Bag analysis"
      summary="AI feedback on setup, gaps & recommendations"
    >
      {!analysis && !pending && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-forest-600 flex-1">
            Get AI feedback on your bag setup, gaps, and recommendations.
          </p>
          <AIFactorsBadge factors={AI_FACTORS.bagAnalysis} direction="down" />
        </div>
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
        <>
          <div className="space-y-2">
            <p className="text-xs font-medium text-forest-500 uppercase tracking-wide">Ask a follow-up</p>
            <div className="flex flex-wrap gap-2">
              {FOLLOW_UPS.map((q) => (
                <button
                  key={q.key}
                  onClick={() => askFollowUp(q.key)}
                  disabled={followUpPending}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors disabled:opacity-50 ${
                    activeFollowUp === q.key
                      ? "bg-forest-700 text-white border-forest-700"
                      : "border-forest-300 text-forest-700 hover:border-forest-500 hover:bg-forest-50"
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {followUpPending && (
            <div className="space-y-2">
              {[1, 0.85, 0.7].map((w, i) => (
                <div key={i} className="h-2.5 bg-forest-100 rounded animate-pulse" style={{ width: `${w * 100}%` }} />
              ))}
            </div>
          )}

          {followUpAnswer && (
            <div className="rounded-xl bg-lime-50 border border-lime-200 p-4 space-y-2">
              {followUpAnswer.split("\n").filter(Boolean).map((line, i) => (
                <p key={i} className="text-sm text-forest-800 leading-relaxed">{line}</p>
              ))}
            </div>
          )}

          {followUpError && (
            <p className="text-sm text-red-700 bg-red-50 p-3 rounded">{followUpError}</p>
          )}

          <button onClick={() => { setAnalysis(null); setFollowUpAnswer(null); setFollowUpError(null); setActiveFollowUp(null); }} className="btn-secondary w-full text-sm">
            Clear
          </button>
        </>
      )}
    </Disclosure>
  );
}
