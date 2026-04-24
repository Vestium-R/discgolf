import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Badge",
  description: "Round-by-round badge tracker for our disc golf crew",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="sticky top-0 z-20 border-b border-forest-200 bg-white/80 backdrop-blur">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold text-forest-800">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full badge-crown text-sm">★</span>
              The Badge
            </Link>
            <nav className="flex gap-1 text-sm">
              <NavLink href="/">Home</NavLink>
              <NavLink href="/rounds">Rounds</NavLink>
              <NavLink href="/seasons">Seasons</NavLink>
              <NavLink href="/add">Add</NavLink>
              <NavLink href="/admin">⚙</NavLink>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-8 text-xs text-forest-600/70 text-center">
          Pass it, keep it, win it.
        </footer>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-1.5 text-forest-700 hover:bg-forest-50 transition-colors"
    >
      {children}
    </Link>
  );
}
