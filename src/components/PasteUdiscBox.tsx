"use client";
import { useState } from "react";

export function PasteUdiscBox({ action }: { action: string }) {
  const [v, setV] = useState("");
  return (
    <form action={action} method="POST" className="flex flex-col gap-2 sm:flex-row">
      <input
        name="udiscUrl"
        type="url"
        inputMode="url"
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder="Paste UDisc scorecard link (udisc.com/scorecards/…)"
        className="flex-1 input-pill"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={async () => {
            try {
              const t = await navigator.clipboard.readText();
              if (t) setV(t);
            } catch {
              /* clipboard blocked; user will paste manually */
            }
          }}
          className="btn-secondary whitespace-nowrap"
        >
          Paste
        </button>
        <button type="submit" className="btn-primary whitespace-nowrap">
          Add round
        </button>
      </div>
    </form>
  );
}
