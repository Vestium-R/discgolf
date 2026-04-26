import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { InstallPrompt } from "@/components/InstallPrompt";

export const metadata: Metadata = {
  title: "The Patch",
  description: "The Traveling Patch — round-by-round disc golf tracker",
  openGraph: {
    title: "The Patch",
    description: "The Traveling Patch — round-by-round disc golf tracker",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="sticky top-0 z-20 border-b border-forest-200 bg-white/80 backdrop-blur">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold text-forest-800 shrink-0">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full badge-crown text-sm">🥏</span>
              The Patch
            </Link>
            {/* Top nav — desktop only; mobile uses the bottom tab bar */}
            <nav className="hidden sm:flex gap-1 text-sm overflow-x-auto scrollbar-none flex-1 justify-end">
              <NavLink href="/">Home</NavLink>
              <NavLink href="/rounds">Rounds</NavLink>
              <NavLink href="/stats">Stats</NavLink>
              <NavLink href="/seasons">Seasons</NavLink>
              <NavLink href="/courses">Courses</NavLink>
              <NavLink href="/rules">Rules</NavLink>
              <NavLink href="/setup">Setup</NavLink>
              <NavLink href="/admin">⚙</NavLink>
            </nav>
          </div>
        </header>

        {/* pb-20 on mobile leaves space above the bottom nav */}
        <main className="mx-auto max-w-5xl px-4 py-6 pb-20 sm:pb-8">{children}</main>

        <footer className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:pb-8 text-xs text-forest-600/70 text-center">
          The Traveling Patch · Always live.
        </footer>

        {/* Bottom tab bar — mobile only */}
        <BottomNav />
        <InstallPrompt />
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-2 text-forest-700 hover:bg-forest-50 transition-colors whitespace-nowrap shrink-0"
    >
      {children}
    </Link>
  );
}
