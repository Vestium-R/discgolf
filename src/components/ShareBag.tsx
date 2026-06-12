"use client";
import { useState } from "react";
import type { BagDisc } from "@/lib/types";

export function ShareBag({ discs }: { discs: BagDisc[] }) {
  const [copied, setCopied] = useState(false);

  const bagDiscs = discs.filter(d => !d.inStorage);
  const shareText = [
    `I've got a ${bagDiscs.length}-disc bag 🥏`,
    ...bagDiscs.map(d => `• ${d.discName} (${d.speed}/${d.glide ?? '—'}/${d.turn ?? '—'}/${d.fade ?? '—'})`),
  ].join("\n");

  function copyToClipboard() {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copyToClipboard}
      className="btn-secondary text-sm"
      title="Copy bag to clipboard"
    >
      {copied ? "✓ Copied!" : "📤 Share bag"}
    </button>
  );
}
