"use client";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="ml-auto sm:ml-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-forest-600 hover:bg-forest-50 hover:text-forest-800 transition-colors"
    >
      {dark === null ? null : dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
