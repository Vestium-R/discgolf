"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import type { AuthUserId } from "@/lib/id-validation";

export function DesktopNav({ userId }: { userId?: AuthUserId }) {
  const pathname = usePathname() ?? "";
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const isOutsideStats = !statsRef.current?.contains(target);
      const isOutsideMore = !moreRef.current?.contains(target);

      if (isOutsideStats && isOutsideMore) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="hidden sm:flex gap-1 text-sm flex-1 justify-end">
      <NavLink href="/" active={isActive("/")}>
        Home
      </NavLink>
      <NavLink href="/rounds" active={isActive("/rounds")}>
        Rounds
      </NavLink>

      {/* Stats Dropdown */}
      <div ref={statsRef} className="relative">
        <button
          onClick={() =>
            setOpenDropdown(openDropdown === "stats" ? null : "stats")
          }
          className={`rounded-full px-3 py-2 transition-colors cursor-pointer font-medium flex items-center gap-1 ${
            isActive("/stats") || isActive("/courses") || openDropdown === "stats"
              ? "text-forest-800 bg-forest-50"
              : "text-forest-700 hover:bg-forest-50"
          }`}
        >
          <span>Stats</span>
          <span className={`text-xs transition-transform ${openDropdown === "stats" ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>
        <div
          className={`absolute top-full left-0 mt-2 bg-white border border-forest-200 rounded-lg shadow-xl p-3 space-y-0 z-50 w-48 transition-all duration-150 ${
            openDropdown === "stats"
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          {userId && (
            <>
              <NavLink href="/my-stats" active={isActive("/players/")}>
                👤 My Stats
              </NavLink>
              <div className="h-px bg-forest-100 my-1" />
            </>
          )}
          <NavLink href="/stats" active={isActive("/stats")}>
            Stats
          </NavLink>
          <NavLink href="/courses" active={isActive("/courses")}>
            Courses
          </NavLink>
          <NavLink href="/seasons" active={isActive("/seasons")}>
            Seasons
          </NavLink>
        </div>
      </div>

      <NavLink href="/bag" active={isActive("/bag")}>
        My Bag
      </NavLink>
      <NavLink href="/in-round" active={isActive("/in-round")}>
        In Round
      </NavLink>
      <NavLink href="/rules" active={isActive("/rules")}>
        Rules
      </NavLink>

      {/* More Dropdown */}
      <div ref={moreRef} className="relative">
        <button
          onClick={() => setOpenDropdown(openDropdown === "more" ? null : "more")}
          className={`rounded-full px-3 py-2 transition-colors cursor-pointer font-medium flex items-center gap-1 ${
            isActive("/setup") || isActive("/admin") || openDropdown === "more"
              ? "text-forest-800 bg-forest-50"
              : "text-forest-700 hover:bg-forest-50"
          }`}
        >
          <span>More</span>
          <span className={`text-xs transition-transform ${openDropdown === "more" ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>
        <div
          className={`absolute top-full left-0 mt-2 bg-white border border-forest-200 rounded-lg shadow-xl p-3 space-y-0 z-50 w-40 transition-all duration-150 ${
            openDropdown === "more"
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        >
          <NavLink href="/setup" active={isActive("/setup")}>
            Setup
          </NavLink>
          <NavLink href="/admin" active={isActive("/admin")}>
            ⚙ Admin
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-full px-3 py-2 transition-colors whitespace-nowrap shrink-0 ${
        active
          ? "text-forest-800 bg-forest-50"
          : "text-forest-700 hover:bg-forest-50"
      }`}
    >
      {children}
    </Link>
  );
}
