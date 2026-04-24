import { parseUdiscUrl } from "@/lib/udisc";

/**
 * Embeds UDisc's own rendered course-map page inline as an iframe.
 * UDisc does not send X-Frame-Options or frame-ancestors CSP, so embedding
 * is allowed. Falls back to a link card if the parse fails to find a slug.
 */
export async function CourseMap({ udiscUrl, title }: { udiscUrl: string; title?: string }) {
  const parsed = await parseUdiscUrl(udiscUrl);
  if (!parsed.ok || !parsed.courseMapUrl) return null;
  return (
    <section className="card overflow-hidden p-0">
      <div className="px-4 py-2 border-b border-forest-100 flex items-center justify-between">
        <span className="text-sm font-semibold text-forest-700">🗺️ Course map{title ? ` — ${title}` : ""}</span>
        <a
          href={parsed.courseMapUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-forest-600 hover:text-forest-900 hover:underline"
        >
          Open full page ↗
        </a>
      </div>
      <iframe
        src={parsed.courseMapUrl}
        title="Course map"
        className="block w-full border-0"
        style={{ height: "500px" }}
        loading="lazy"
      />
    </section>
  );
}
