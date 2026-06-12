"use client";
import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function Disclosure({
  icon,
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  icon?: ReactNode;
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-forest-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          {icon && <span className="text-forest-600 shrink-0">{icon}</span>}
          <span className="font-display font-bold text-forest-800">{title}</span>
          {!open && summary && (
            <span className="text-xs text-forest-500 truncate">· {summary}</span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-forest-500 shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="border-t border-forest-100 px-4 py-4 space-y-4">{children}</div>}
    </div>
  );
}
