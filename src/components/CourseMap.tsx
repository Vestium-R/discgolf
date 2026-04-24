import { parseUdiscUrl } from "@/lib/udisc";

const MAPBOX_STYLE = "mapbox/outdoors-v12";
const WIDTH = 800;
const HEIGHT = 360;

/**
 * Server-rendered static Mapbox map showing tee + basket pins for every hole
 * in the round's UDisc scorecard. Returns null silently if MAPBOX_ACCESS_TOKEN
 * is unset or the parse yielded no coordinates — never blocks the page.
 */
export async function CourseMap({ udiscUrl, title }: { udiscUrl: string; title?: string }) {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) return null;
  const parsed = await parseUdiscUrl(udiscUrl);
  if (!parsed.ok || !parsed.coords || parsed.coords.length < 2) return null;

  // Mapbox static images cap URL length at ~8KB, so if we have too many
  // coords (lots of tee variants) we sample every Nth to stay under.
  const step = Math.max(1, Math.ceil(parsed.coords.length / 40));
  const sampled = parsed.coords.filter((_, i) => i % step === 0);

  const overlays = sampled
    .map(({ lat, lng }) => `pin-s+305036(${lng.toFixed(5)},${lat.toFixed(5)})`)
    .join(",");
  const imgUrl =
    `https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/static/` +
    `${overlays}/auto/${WIDTH}x${HEIGHT}@2x?padding=30&access_token=${token}`;

  return (
    <section className="card overflow-hidden p-0">
      {title && <div className="px-4 py-2 border-b border-forest-100 text-sm font-semibold text-forest-700">{title}</div>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imgUrl} alt="Course map" className="block w-full h-auto" />
    </section>
  );
}
