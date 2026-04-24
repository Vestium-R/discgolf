import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kent Disc Golf",
  description: "Season standings and badge tracker",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b border-forest-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
            <Link href="/" className="font-display text-2xl font-bold text-forest-800">
              Kent Disc Golf
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/" className="hover:text-forest-600">Standings</Link>
              <Link href="/rounds" className="hover:text-forest-600">Rounds</Link>
              <Link href="/history" className="hover:text-forest-600">History</Link>
              <Link href="/admin" className="hover:text-forest-600">Admin</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-4xl px-4 py-8 text-xs text-forest-600 opacity-70">
          Kent County, NB
        </footer>
      </body>
    </html>
  );
}
