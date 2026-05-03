"use client";
import { useState } from "react";
import type { BagDisc } from "@/lib/types";
import { DISC_TYPE_COLORS, DISC_TYPE_LABELS } from "@/lib/types";

export function ShareBag({ discs }: { discs: BagDisc[] }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const bagDiscs = discs.filter(d => !d.inStorage);
  const byType = (t: any) => bagDiscs.filter(d => d.type === t);
  const putters = byType("putter");
  const mids = byType("midrange");
  const fairways = byType("fairway_driver");
  const drivers = byType("distance_driver");

  const shareText = [
    `I've got a ${bagDiscs.length}-disc bag 🥏`,
    ...bagDiscs.map(d => `• ${d.discName} (${d.speed}/${d.glide || '—'}/${d.turn || '—'}/${d.fade || '—'})`),
  ].join("\n");

  function copyToClipboard() {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary w-full text-sm">
        📤 Share my bag
      </button>
    );
  }

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-forest-800">Share your bag</h3>
        <button onClick={() => setOpen(false)} className="text-xs text-forest-400">✕</button>
      </div>

      {/* Bag preview card */}
      <div className="bg-gradient-to-br from-forest-600 to-forest-800 rounded-2xl p-6 text-white space-y-4">
        <div>
          <div className="text-sm opacity-80">My disc golf bag</div>
          <div className="text-3xl font-bold">{bagDiscs.length} discs</div>
        </div>

        <div className="space-y-3 text-sm">
          {putters.length > 0 && (
            <div>
              <div className="opacity-75 text-xs uppercase tracking-wide mb-1">
                Putters ({putters.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {putters.map(d => (
                  <span
                    key={d.id}
                    className="px-2 py-1 bg-white/20 rounded text-xs font-medium"
                  >
                    {d.discName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {mids.length > 0 && (
            <div>
              <div className="opacity-75 text-xs uppercase tracking-wide mb-1">
                Midranges ({mids.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {mids.map(d => (
                  <span
                    key={d.id}
                    className="px-2 py-1 bg-white/20 rounded text-xs font-medium"
                  >
                    {d.discName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {fairways.length > 0 && (
            <div>
              <div className="opacity-75 text-xs uppercase tracking-wide mb-1">
                Fairway drivers ({fairways.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {fairways.map(d => (
                  <span
                    key={d.id}
                    className="px-2 py-1 bg-white/20 rounded text-xs font-medium"
                  >
                    {d.discName}
                  </span>
                ))}
              </div>
            </div>
          )}

          {drivers.length > 0 && (
            <div>
              <div className="opacity-75 text-xs uppercase tracking-wide mb-1">
                Distance drivers ({drivers.length})
              </div>
              <div className="flex flex-wrap gap-1">
                {drivers.map(d => (
                  <span
                    key={d.id}
                    className="px-2 py-1 bg-white/20 rounded text-xs font-medium"
                  >
                    {d.discName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share methods */}
      <div className="space-y-2">
        <button
          onClick={copyToClipboard}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-forest-200 bg-forest-50 hover:bg-forest-100 transition-colors text-sm font-medium text-forest-800"
        >
          <span>{copied ? "✓ Copied!" : "Copy to clipboard"}</span>
          <span className="text-xs">📋</span>
        </button>

        <p className="text-xs text-forest-600 text-center pt-2">
          Paste into Discord, Instagram, or your group chat
        </p>
      </div>

      <div className="pt-2 border-t border-forest-100">
        <p className="text-xs text-forest-500 p-2 rounded bg-forest-50">
          <span className="font-medium">What's shared:</span> Disc names and flight numbers only. No personal data.
        </p>
      </div>
    </div>
  );
}
