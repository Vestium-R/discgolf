"use client";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pwa-install-dismissed";

export function InstallPrompt() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Register SW once, ignore failures (dev, iOS older Safari).
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    // Already installed / launched standalone? Never show the banner.
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!evt) return null;

  return (
    <div className="fixed inset-x-3 bottom-16 z-50 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-sm rounded-2xl border border-forest-200 bg-white p-3 shadow-lg flex items-center gap-3">
      <span className="text-2xl">🥏</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-forest-800">Install the app</div>
        <div className="text-xs text-forest-600">One tap to paste UDisc rounds from your home screen.</div>
      </div>
      <button
        className="text-xs text-forest-500 hover:text-forest-800 px-2"
        onClick={() => { localStorage.setItem(DISMISS_KEY, "1"); setEvt(null); }}
      >
        ✕
      </button>
      <button
        className="btn-primary text-sm"
        onClick={async () => {
          try {
            await evt.prompt();
            await evt.userChoice;
          } finally {
            setEvt(null);
          }
        }}
      >
        Install
      </button>
    </div>
  );
}
