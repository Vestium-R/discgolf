"use client";
import { useEffect, useState } from "react";

export function ShareSummary({ text, roundId }: { text: string; roundId?: string }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (roundId && typeof window !== "undefined") {
      setUrl(`${window.location.origin}/rounds/${roundId}`);
    }
  }, [roundId]);
  // The text that actually hits the clipboard / share sheet: medal summary
  // plus the round URL so Messenger/Discord unfurl the OG image card under it.
  const payload = url ? `${text}\n\n${url}` : text;

  async function copy() {
    await navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  async function share() {
    if (navigator.share) {
      try {
        await navigator.share(url ? { text, url } : { text });
        return;
      } catch {
        /* cancelled */
      }
    }
    copy();
  }
  return (
    <section className="rounded-2xl border border-forest-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-forest-700">Share to Messenger</h3>
        <div className="flex gap-2">
          <button
            onClick={copy}
            className="rounded-lg border border-forest-300 bg-white px-3 py-1 text-xs font-medium text-forest-700 hover:bg-forest-50"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={share}
            className="rounded-lg bg-forest-600 px-3 py-1 text-xs font-semibold text-white hover:bg-forest-700"
          >
            Share
          </button>
        </div>
      </div>
      <pre className="whitespace-pre-wrap rounded-lg bg-forest-50 p-3 text-sm text-forest-800 font-sans">{payload}</pre>
      <p className="mt-2 text-xs text-forest-600">
        Paste into the Messenger group chat — Messenger will unfurl the round link with a preview card.
      </p>
    </section>
  );
}
