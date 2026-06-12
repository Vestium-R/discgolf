"use client";
import { useEffect, useState } from "react";

type Insight = { emoji: string; text: string };

export function InsightTicker({ insights }: { insights: Insight[] }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (insights.length <= 1) return;
    const t = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % insights.length);
        setVisible(true);
      }, 300);
    }, 8000);
    return () => clearInterval(t);
  }, [insights.length]);

  if (insights.length === 0) return null;
  const insight = insights[idx];

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className={`flex items-center gap-3 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}>
        <span className="text-2xl shrink-0">{insight.emoji}</span>
        <p className="text-sm text-amber-900">{insight.text}</p>
      </div>
    </div>
  );
}
