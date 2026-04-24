"use client";
import { useRef, useState } from "react";

export function PasteUdiscBox({ action }: { action: string }) {
  const [v, setV] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const submitSoon = () => {
    requestAnimationFrame(() => formRef.current?.requestSubmit());
  };

  return (
    <form ref={formRef} action={action} method="POST" className="flex flex-col gap-2 sm:flex-row">
      <input
        name="udiscUrl"
        type="url"
        inputMode="url"
        value={v}
        onChange={(e) => {
          const next = e.target.value;
          setV(next);
          if (/udisc\.com\/scorecards\/[A-Za-z0-9_-]+/.test(next)) submitSoon();
        }}
        placeholder="Paste UDisc scorecard link (udisc.com/scorecards/…)"
        className="flex-1 input-pill"
        autoFocus
      />
      <button
        type="button"
        onClick={async () => {
          try {
            const t = await navigator.clipboard.readText();
            if (t) {
              setV(t);
              submitSoon();
            }
          } catch {
            /* clipboard blocked; user will paste manually */
          }
        }}
        className="btn-secondary whitespace-nowrap"
      >
        Paste from clipboard
      </button>
    </form>
  );
}
