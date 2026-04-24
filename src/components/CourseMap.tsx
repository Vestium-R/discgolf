/**
 * Renders a Mapbox static course image via our /api/course-map proxy so the
 * MAPBOX_ACCESS_TOKEN never leaves the server. The route itself returns 404
 * when the token is unset, so we can unconditionally render the <img>; broken
 * images are the graceful degradation.
 */
export function CourseMap({ udiscUrl, title }: { udiscUrl: string; title?: string }) {
  if (!process.env.MAPBOX_ACCESS_TOKEN) return null;
  const src = `/api/course-map?url=${encodeURIComponent(udiscUrl)}`;
  return (
    <section className="card overflow-hidden p-0">
      {title && <div className="px-4 py-2 border-b border-forest-100 text-sm font-semibold text-forest-700">{title}</div>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Course map" className="block w-full h-auto" loading="lazy" />
    </section>
  );
}
