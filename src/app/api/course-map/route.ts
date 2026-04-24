import { NextResponse, type NextRequest } from "next/server";
import { parseUdiscUrl } from "@/lib/udisc";

const MAPBOX_STYLE = "mapbox/satellite-streets-v12";
const WIDTH = 800;
const HEIGHT = 360;

// Google/Mapbox polyline encoding for a list of [lat, lng] pairs.
function encodePolyline(coords: { lat: number; lng: number }[]): string {
  let lastLat = 0, lastLng = 0, out = "";
  const encode = (n: number) => {
    n = n < 0 ? ~(n << 1) : n << 1;
    let s = "";
    while (n >= 0x20) {
      s += String.fromCharCode((0x20 | (n & 0x1f)) + 63);
      n >>= 5;
    }
    s += String.fromCharCode(n + 63);
    return s;
  };
  for (const c of coords) {
    const lat = Math.round(c.lat * 1e5);
    const lng = Math.round(c.lng * 1e5);
    out += encode(lat - lastLat) + encode(lng - lastLng);
    lastLat = lat;
    lastLng = lng;
  }
  return out;
}

/**
 * Proxy for the Mapbox Static Images API.
 * Query params:
 *   url = UDisc scorecard URL (required)
 *
 * Server-side fetch keeps the MAPBOX_ACCESS_TOKEN out of the HTML entirely.
 * We also gate requests to our own domain via the Origin/Referer headers so
 * a leaked <img> src on another site can't burn your quota.
 */
export async function GET(req: NextRequest) {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) return new NextResponse("map disabled", { status: 404 });

  // Only serve requests that appear to come from our own domain.
  const host = req.headers.get("host") ?? "";
  const referer = req.headers.get("referer") ?? "";
  const origin = req.headers.get("origin") ?? "";
  const ok = [referer, origin].some((v) => v.includes(host));
  if (!ok && !referer.startsWith("http://localhost")) {
    return new NextResponse("forbidden", { status: 403 });
  }

  const udiscUrl = req.nextUrl.searchParams.get("url");
  if (!udiscUrl) return new NextResponse("missing url", { status: 400 });

  const parsed = await parseUdiscUrl(udiscUrl);
  if (!parsed.ok || !parsed.coords || parsed.coords.length < 2) {
    return new NextResponse("no coords", { status: 404 });
  }

  const step = Math.max(1, Math.ceil(parsed.coords.length / 40));
  const sampled = parsed.coords.filter((_, i) => i % step === 0);
  // Path overlay connects every sampled point in order (tee → basket → next tee …).
  // Encoded polyline prefix is `path-{width}+{color}-{opacity}+{fillColor}-{fillOpacity}(POLY)`.
  const polyEncoded = encodePolyline(sampled).replace(/[\\?#%]/g, (c) => encodeURIComponent(c));
  const pathOverlay = `path-3+ffcc00-0.9(${polyEncoded})`;
  const pinOverlays = sampled
    .map(({ lat, lng }) => `pin-s+ef4444(${lng.toFixed(5)},${lat.toFixed(5)})`)
    .join(",");
  const overlays = `${pathOverlay},${pinOverlays}`;
  const imgUrl =
    `https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/static/` +
    `${overlays}/auto/${WIDTH}x${HEIGHT}@2x?padding=30&access_token=${token}`;

  const res = await fetch(imgUrl);
  if (!res.ok) return new NextResponse(`upstream ${res.status}`, { status: 502 });
  const buf = await res.arrayBuffer();
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      // A scorecard is immutable — tee/basket positions never change for a
      // completed round. Cache for a year so Mapbox is called at most once
      // per unique scorecard, ever.
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
    },
  });
}
