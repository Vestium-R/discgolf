"use client";
import { useState } from "react";

export function ShareStandings({ text, url }: { text: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const payload = `${text}\n\n${url}`;

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ text, url });
        return;
      } catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={share}
      className="text-xs text-forest-600 hover:text-forest-800 hover:underline transition-colors"
    >
      {copied ? "Copied! ✓" : "Share standings"}
    </button>
  );
}
