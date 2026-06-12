"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Home,
  Disc,
  Backpack,
  History,
  User,
  BarChart3,
  Trophy,
  MapPin,
  ClipboardList,
  Smartphone,
  Settings,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

const primaryTabs: { href: string; label: string; icon: LucideIcon; exact?: boolean; add?: boolean }[] = [
  { href: "/",         label: "Home",     icon: Home, exact: true },
  { href: "/in-round", label: "In Round", icon: Disc },
  { href: "/add",      label: "Add",      icon: Home, add: true },
  { href: "/bag",      label: "Bag",      icon: Backpack },
  { href: "/rounds",   label: "Rounds",   icon: History },
];

const moreTabs: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/my-stats", label: "My Stats", icon: User },
  { href: "/stats",    label: "Stats",    icon: BarChart3 },
  { href: "/seasons",  label: "Seasons",  icon: Trophy },
  { href: "/courses",  label: "Courses",  icon: MapPin },
  { href: "/rules",    label: "Rules",    icon: ClipboardList },
  { href: "/setup",    label: "Setup",    icon: Smartphone },
  { href: "/admin",    label: "Admin",    icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname() ?? "";
  const [moreOpen, setMoreOpen] = useState(false);

  // Close the sheet whenever the route changes
  useEffect(() => { setMoreOpen(false); }, [pathname]);

  const moreActive = moreTabs.some((t) => pathname.startsWith(t.href));

  return (
    <>
      {/* More sheet overlay */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 sm:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="absolute bottom-14 inset-x-0 bg-white border-t border-forest-200 shadow-xl rounded-t-2xl px-4 py-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-3 gap-1 pb-1">
              {moreTabs.map((t) => {
                const active = pathname.startsWith(t.href);
                const Icon = t.icon;
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-medium transition-colors ${
                      active ? "bg-forest-100 text-forest-800" : "text-forest-600 hover:bg-forest-50"
                    }`}
                  >
                    <Icon size={22} strokeWidth={1.75} />
                    <span>{t.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-t border-forest-200 sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-14 max-w-5xl mx-auto">
          {primaryTabs.map((tab) => {
            const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
            const Icon = tab.icon;

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
                  active ? "text-forest-800" : "text-forest-500"
                }`}
              >
                {active && <span className="absolute top-0 left-1/4 right-1/4 h-[2px] rounded-b bg-forest-700" />}
                <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
                <span>{tab.label}</span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen((o) => !o)}
            className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
              moreActive || moreOpen ? "text-forest-800" : "text-forest-500"
            }`}
          >
            {(moreActive || moreOpen) && (
              <span className="absolute top-0 left-1/4 right-1/4 h-[2px] rounded-b bg-forest-700" />
            )}
            <MoreHorizontal size={20} strokeWidth={moreActive || moreOpen ? 2.25 : 1.75} />
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
