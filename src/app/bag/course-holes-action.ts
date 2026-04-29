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

    // UDisc uses React Router turbo-stream (same format as scorecards)
    const streamMatch = html.match(/streamController\.enqueue\("((?:[^"\\]|\\.)+)"\)/);
    if (!streamMatch) return { ok: false, error: "Couldn't find course data in page." };

    let decoded: string;
    try { decoded = JSON.parse('"' + streamMatch[1] + '"'); }
    catch { return { ok: false, error: "Couldn't decode page data." }; }

    let arr: unknown[];
    try { arr = JSON.parse(decoded) as unknown[]; }
    catch { return { ok: false, error: "Couldn't parse course data." }; }

    // Resolve a field from a _N reference object
    function getField(obj: unknown, fieldName: string): unknown {
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) return undefined;
      const o = obj as Record<string, unknown>;
      if (Object.prototype.hasOwnProperty.call(o, fieldName)) return o[fieldName];
      for (const [k, v] of Object.entries(o)) {
        if (!k.startsWith("_")) continue;
        const ki = parseInt(k.slice(1), 10);
        if (arr[ki] === fieldName) {
          if (typeof v === "number") return v >= 0 ? arr[v] : v === -5 ? false : v === -7 ? null : v;
          return v;
        }
      }
      return undefined;
    }

    // Course name
    const courseNameIdx = arr.indexOf("courseName");
    const courseName = courseNameIdx > -1 && typeof arr[courseNameIdx + 1] === "string"
      ? arr[courseNameIdx + 1] as string
      : slug;

    // Find "holes" key and its indices array
    const holesKeyIdx = arr.indexOf("holes");
    if (holesKeyIdx === -1) return { ok: false, error: "No hole data found for this course on UDisc." };

    // The indices array follows the key
    let holeIndices: number[] | null = null;
    for (let j = holesKeyIdx + 1; j < Math.min(holesKeyIdx + 10, arr.length); j++) {
      const v = arr[j];
      if (Array.isArray(v) && v.length > 0 && typeof v[0] === "number") {
        holeIndices = v as number[];
        break;
      }
    }
    if (!holeIndices || holeIndices.length === 0) {
      return { ok: false, error: "Hole data exists but couldn't read hole list." };
    }

    // Each index points to a hole object — resolve distance (stored in metres) and par
    const holes: HoleData[] = [];
    holeIndices.forEach((idx, i) => {
      const holeObj = arr[idx];
      const distM = getField(holeObj, "distance");
      const par   = getField(holeObj, "par");
      if (typeof distM === "number" && distM > 0) {
        holes.push({
          hole: i + 1,
          distance: Math.round(distM * 3.28084), // metres → feet
          par: typeof par === "number" ? par : undefined,
        });
      }
    });

    if (holes.length === 0) return { ok: false, error: "Holes found but no distances recorded on UDisc yet." };

    return { ok: true, courseName, holes };
  } catch (e) {
    return { ok: false, error: `Couldn't load course: ${(e as Error).message}` };
  }
}
