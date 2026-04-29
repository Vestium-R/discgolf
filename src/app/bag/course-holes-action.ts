"use server";

export type HoleData = { hole: number; distance: number; par?: number };

export async function fetchCourseHolesAction(
  slug: string,
): Promise<{ ok: true; courseName: string; holes: HoleData[] } | { ok: false; error: string }> {
  try {
    const res = await fetch(`https://udisc.com/courses/${slug}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; DiscGolfLeagueBot/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return { ok: false, error: `UDisc returned ${res.status}` };
    const html = await res.text();

    let payload: string | null = null;

    // Method 1: React Router turbo-stream (current UDisc format)
    const streamMatch = html.match(/streamController\.enqueue\("((?:[^"\\]|\\.)+)"\)/);
    if (streamMatch) {
      try { payload = JSON.parse('"' + streamMatch[1] + '"'); } catch { /* fall through */ }
    }

    // Method 2: Next.js __NEXT_DATA__ (older UDisc format)
    if (!payload) {
      const nextMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/);
      if (nextMatch) payload = nextMatch[1];
    }

    // Method 3: any window.__data or similar embedded JSON
    if (!payload) {
      const winMatch = html.match(/window\.__(?:data|props|state)\s*=\s*(\{.{0,50000}\})/s);
      if (winMatch) payload = winMatch[1];
    }

    if (!payload) {
      // Try extracting hole data directly from raw HTML with regex as last resort
      const holes = extractHolesFromHtml(html);
      if (holes.length > 0) {
        const nameM = html.match(/<title>([^<]+)<\/title>/);
        const courseName = nameM?.[1]?.replace(/ [-|].*/, "").trim() ?? slug;
        return { ok: true, courseName, holes };
      }
      return { ok: false, error: "UDisc changed their page format — hole distances unavailable. Try General mode or enter distance manually." };
    }

    const str = typeof payload === "string" && payload.startsWith("[")
      ? JSON.stringify(JSON.parse(payload))  // turbo-stream array
      : payload;

    // Extract course name
    const nameM = str.match(/"courseName":"([^"]+)"/) ?? str.match(/"name":"([^"]+)","city"/);
    const courseName = nameM?.[1] ?? slug;

    // Extract holes — handle both keyed and positional formats
    const holes: HoleData[] = extractHolesFromJson(str);

    if (holes.length === 0) {
      // Fall back to raw HTML extraction
      const htmlHoles = extractHolesFromHtml(html);
      if (htmlHoles.length > 0) return { ok: true, courseName, holes: htmlHoles };
      return { ok: false, error: "Course found but hole distances aren't available for this course on UDisc yet." };
    }

    return { ok: true, courseName, holes: holes.sort((a, b) => a.hole - b.hole) };
  } catch (e) {
    return { ok: false, error: `Couldn't load course data: ${(e as Error).message}` };
  }
}

function extractHolesFromJson(str: string): HoleData[] {
  const holes: HoleData[] = [];
  const seen = new Set<number>();

  // Pattern 1: "holeNumber":N,...,"distance":M
  for (const m of str.matchAll(/"holeNumber":(\d+)(?:[^}]{0,500}?"distance":(\d+))?/g)) {
    const hole = Number(m[1]);
    const dist = m[2] ? Number(m[2]) : 0;
    if (!seen.has(hole) && dist > 0) { holes.push({ hole, distance: dist }); seen.add(hole); }
  }
  if (holes.length > 0) return holes;

  // Pattern 2: "hole":N,"distance":M
  for (const m of str.matchAll(/"hole":(\d+)[^}]{0,200}"distance":(\d+)/g)) {
    const hole = Number(m[1]);
    const dist = Number(m[2]);
    if (!seen.has(hole) && dist > 0) { holes.push({ hole, distance: dist }); seen.add(hole); }
  }
  return holes;
}

function extractHolesFromHtml(html: string): HoleData[] {
  // Try to find hole data in plain HTML (e.g. table rows, data attributes)
  const holes: HoleData[] = [];
  const seen = new Set<number>();

  // data-hole="N" data-distance="M"
  for (const m of html.matchAll(/data-hole[^=]*="(\d+)"[^>]*data-distance[^=]*="(\d+)"/g)) {
    const hole = Number(m[1]), dist = Number(m[2]);
    if (!seen.has(hole) && dist > 0) { holes.push({ hole, distance: dist }); seen.add(hole); }
  }
  return holes;
}
