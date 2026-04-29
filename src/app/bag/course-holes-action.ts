"use server";

export type HoleData = { hole: number; distance: number; par?: number };

export async function fetchCourseHolesAction(
  slug: string,
): Promise<{ ok: true; courseName: string; holes: HoleData[] } | { ok: false; error: string }> {
  try {
    const res = await fetch(`https://udisc.com/courses/${slug}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; DiscGolfLeagueBot/1.0)",
        Accept: "text/html",
      },
    });
    if (!res.ok) return { ok: false, error: `UDisc returned ${res.status}` };
    const html = await res.text();

    const nextData = html.match(
      /<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/,
    )?.[1];
    if (!nextData) return { ok: false, error: "Couldn't read course data from UDisc." };

    const str = JSON.stringify(JSON.parse(nextData));

    // Course name
    const nameM = str.match(/"courseName":"([^"]+)"/);
    const courseName = nameM?.[1] ?? slug;

    // Hole distances — UDisc encodes as "holeNumber":N,...,"distance":M
    const holes: HoleData[] = [];
    const seen = new Set<number>();
    for (const m of str.matchAll(/"holeNumber":(\d+)(?:[^}]{0,300}?"distance":(\d+))?/g)) {
      const hole = Number(m[1]);
      const dist = m[2] ? Number(m[2]) : 0;
      if (!seen.has(hole) && dist > 0) {
        holes.push({ hole, distance: dist });
        seen.add(hole);
      }
    }

    if (holes.length === 0) {
      return { ok: false, error: "No hole distances found for this course on UDisc." };
    }

    return { ok: true, courseName, holes: holes.sort((a, b) => a.hole - b.hole) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
