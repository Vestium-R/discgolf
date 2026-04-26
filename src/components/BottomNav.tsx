"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/",       label: "Home",   icon: "🏠", exact: true },
  { href: "/rounds", label: "Rounds", icon: "🥏" },
  { href: "/add",    label: "Add",    icon: "+",  add: true },
  { href: "/stats",  label: "Stats",  icon: "📊" },
  { href: "/setup",  label: "Setup",  icon: "📱" },
];

export function BottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-forest-200 sm:hidden">
      {/* env(safe-area-inset-bottom) keeps the bar above the iOS home indicator */}
      <div
        className="flex h-14 max-w-5xl mx-auto"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {tabs.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

          if (tab.add) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-label="Add round"
                className="flex-1 flex items-center justify-center"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-forest-700 text-white text-2xl font-medium shadow-md active:scale-95 transition">
                  +
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                active ? "text-forest-800" : "text-forest-400"
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/4 right-1/4 h-[2px] rounded-b bg-forest-700" />
              )}
              <span className="text-lg leading-none">{tab.icon}</span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
