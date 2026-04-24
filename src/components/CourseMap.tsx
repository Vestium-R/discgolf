import { parseUdiscUrl } from "@/lib/udisc";

/**
 * Renders a link card to UDisc's own rendered course map. UDisc already
 * publishes per-course layouts with tee signs, fairway lines, labeled
 * baskets — no point reimplementing that with pins. Just deep-link.
 */
export async function CourseMap({ udiscUrl, title }: { udiscUrl: string; title?: string }) {
  const parsed = await parseUdiscUrl(udiscUrl);
  if (!parsed.ok || !parsed.courseMapUrl) return null;
  return (
    <a
      href={parsed.courseMapUrl}
      target="_blank"
      rel="noreferrer"
      className="card p-4 flex items-center gap-3 hover:border-forest-300 transition group"
    >
      <span className="text-2xl">🗺️</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-forest-800 group-hover:underline">
          View course map{title ? ` — ${title}` : ""}
        </div>
        <div className="text-xs text-forest-600">Opens UDisc&apos;s rendered course map with tee signs and fairways.</div>
      </div>
      <span className="text-forest-400 group-hover:text-forest-700 transition">↗</span>
    </a>
  );
}
