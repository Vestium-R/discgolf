"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function FloatingAddButton() {
  const pathname = usePathname();
  if (pathname?.startsWith("/add") || pathname?.startsWith("/admin") || pathname?.startsWith("/auth")) return null;
  return (
    <Link
      href="/add"
      aria-label="Add round"
      className="fixed bottom-5 right-5 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-forest-700 text-white shadow-xl hover:bg-forest-600 active:scale-95 transition sm:hidden"
    >
      <span className="text-2xl leading-none">+</span>
    </Link>
  );
}
