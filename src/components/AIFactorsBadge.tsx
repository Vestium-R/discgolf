"use client";
import { useState } from "react";

export function AIFactorsBadge({ factors }: { factors: readonly string[] }) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        onClick={() => setShow(s => !s)}
        className="ml-1 text-forest-400 hover:text-forest-600 transition-colors leading-none"
        aria-label="What this AI considers"
      >
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-forest-300 text-[9px] font-bold">i</span>
      </button>

      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-forest-900 text-white text-[11px] rounded-xl p-3 shadow-xl z-50 pointer-events-none">
          <p className="font-semibold text-forest-200 mb-1.5">This AI considers:</p>
          <ul className="space-y-1">
            {factors.map((f, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-green-400 shrink-0 mt-px">✓</span>
                <span className="text-forest-100">{f}</span>
              </li>
            ))}
          </ul>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-forest-900" />
        </div>
      )}
    </span>
  );
}
