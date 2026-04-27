import type { Player } from "./types";

export type ParsedEntry = {
  rawName: string;
  username?: string;
  position: number;
  score?: number;
  relativeScore?: number;
  avatarUrl?: string;
};

const UDISC_CDN = "https://d22ksth68ujgu2.cloudfront.net/";

export type UdiscParseResult = {
  ok: boolean;
  url: string;
  courseName?: string;
  layoutName?: string;
  date?: string;
  temperatureC?: number;
  windKph?: number;
  entries: ParsedEntry[];
  courseMapUrl?: string;
  warning?: string;
};

/**
 * UDisc scorecards embed round data as a turbo-stream payload in
 * streamController.enqueue("..."). The payload is a JSON array where each
 * scorecard entry is a reference object using _N keys (key index → value index).
 * We decode the array, find all entry objects by locating their playerData +
 * totalScore fields, and derive finish positions by sorting on totalScore.
 */
export async function parseUdiscUrl(url: string): Promise<UdiscParseResult> {
  const fail = (warning: string): UdiscParseResult => {
    console.error("[udisc] parse failed", { url, warning });
    return { ok: false, url, entries: [], warning };
  };
  let html: string;
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; DiscGolfLeagueBot/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return fail(`UDisc returned HTTP ${res.status}`);
    html = await res.text();
  } catch (e) {
    return fail(`Could not fetch UDisc page: ${(e as Error).message}`);
  }

  const payload = extractStream(html);
  if (!payload) return fail("Could not find scorecard data on page.");

  // Metadata: still available as inline strings in the payload
  const courseNameRaw = payload.match(/"courseName","([^"]+)"/)?.[1];
  const layoutName = payload.match(/"layoutName","([^"]+)"/)?.[1];
  const dateMs = payload.match(/"endDate",\["D",(\d+)\]/)?.[1];
  const date = dateMs ? new Date(Number(dateMs)).toISOString().slice(0, 10) : undefined;

  // Weather: UDisc stores temperature in Kelvin and wind in m/s.
  const tempK = Number(payload.match(/"temperature",(-?\d+(?:\.\d+)?)/)?.[1]);
  const windMps = Number(payload.match(/"wind",\{[^}]+\},"speed",(-?\d+(?:\.\d+)?)/)?.[1]);
  const temperatureC = Number.isFinite(tempK) ? Math.round((tempK - 273.15) * 10) / 10 : undefined;
  const windKph = Number.isFinite(windMps) ? Math.round(windMps * 3.6) : undefined;

  // Parse the turbo-stream array and extract player entries
  const rawEntries = extractEntriesFromTurboStream(payload);

  if (rawEntries.length < 2) {
    return fail("Could not identify players in scorecard — link shows fewer than 2 players.");
  }

  // Derive finish positions by sorting totalScore ascending (lower = better in disc golf).
  // Handle ties: tied players share the lower position number.
  const withScores = rawEntries.filter((e) => Number.isFinite(e.score));
  withScores.sort((a, b) => (a.score as number) - (b.score as number));

  let lastScore: number | null = null;
  let lastPos = 0;
  for (let i = 0; i < withScores.length; i++) {
    if (withScores[i].score === lastScore) {
      withScores[i].position = lastPos;
    } else {
      withScores[i].position = i + 1;
      lastPos = withScores[i].position;
      lastScore = withScores[i].score as number;
    }
  }

  // Entries without a score go at the end (shouldn't happen for complete rounds)
  let tailPos = withScores.length + 1;
  for (const e of rawEntries) {
    if (!Number.isFinite(e.score)) e.position = tailPos++;
  }

  const entries = rawEntries.slice().sort((a, b) => a.position - b.position);

  // Course map URL from rendered HTML slug
  const slugMatches = [...html.matchAll(/\/courses\/([a-z0-9]+(?:-[a-zA-Z0-9]+)+)/g)];
  const slug = slugMatches.map((m) => m[1]).find((s) => s !== "add");
  const courseMapUrl = slug ? `https://udisc.com/courses/${slug}/v2/course-map` : undefined;

  const courseName = courseNameRaw
    ? courseNameRaw + (layoutName ? ` — ${layoutName}` : "")
    : undefined;

  return { ok: true, url, courseName, layoutName, date, temperatureC, windKph, entries, courseMapUrl };
}

/**
 * Decode the turbo-stream JSON array and find scorecard entry objects.
 *
 * The payload is a JSON array. Each entry in a scorecard is stored as a
 * reference object like {"_126": 127, "_142": 143, ...} where:
 *   - The key index (e.g. 126) points to the string "playerData" in the array
 *   - The value index (e.g. 127) points to the playerData sub-object
 * We scan all array elements for objects that have both "playerData" (with a
 * "name" field) and "totalScore" (a number). This finds all players including
 * guests who have no UDisc account.
 */
function extractEntriesFromTurboStream(payload: string): ParsedEntry[] {
  let arr: unknown[];
  try {
    arr = JSON.parse(payload) as unknown[];
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];

  /**
   * Read a named field from a turbo-stream ref object (or a plain object).
   * Ref objects use numeric-keyed strings like "_N" where arr[N] is the key name
   * and the value is an index into arr (or -5=false, -7=null).
   */
  const getField = (obj: Record<string, unknown>, fieldName: string): unknown => {
    // Plain object (e.g. guest playerData: {"name":"Matt 1"})
    if (Object.prototype.hasOwnProperty.call(obj, fieldName)) return obj[fieldName];
    // Reference object: scan _N keys
    for (const [k, v] of Object.entries(obj)) {
      if (k.charCodeAt(0) !== 95) continue; // '_'
      const keyIdx = parseInt(k.slice(1), 10);
      if (arr[keyIdx] === fieldName) {
        if (typeof v === "number") {
          return v >= 0 ? arr[v] : v === -5 ? false : v === -7 ? null : v;
        }
        return v;
      }
    }
    return undefined;
  };

  const results: ParsedEntry[] = [];

  for (const item of arr) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const obj = item as Record<string, unknown>;

    const pdVal = getField(obj, "playerData");
    const tsVal = getField(obj, "totalScore");

    if (!pdVal || typeof pdVal !== "object" || Array.isArray(pdVal)) continue;
    if (typeof tsVal !== "number") continue;

    const pd = pdVal as Record<string, unknown>;
    const name = getField(pd, "name");
    if (!name || typeof name !== "string") continue;

    const username = getField(pd, "username");
    const thumbFile = getField(pd, "thumbnailImage");
    const avatarUrl = typeof thumbFile === "string" ? UDISC_CDN + thumbFile : undefined;

    const rsVal = getField(obj, "relativeScore");

    results.push({
      rawName: name,
      username: typeof username === "string" ? username : undefined,
      position: 0, // filled in by caller
      score: tsVal,
      relativeScore: typeof rsVal === "number" ? rsVal : undefined,
      avatarUrl,
    });
  }

  return results;
}

function extractStream(html: string): string | null {
  const m = html.match(/streamController\.enqueue\("((?:[^"\\]|\\.)+)"\)/);
  if (!m) return null;
  try {
    return JSON.parse('"' + m[1] + '"');
  } catch {
    return null;
  }
}

export function matchPlayer(rawName: string, roster: Player[], username?: string): Player | null {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  if (username) {
    const u = norm(username);
    for (const p of roster) {
      if (p.udiscHandle && norm(p.udiscHandle) === u) return p;
    }
  }
  const target = norm(rawName);
  const targetParts = target.split(" ").filter(Boolean);

  for (const p of roster) {
    if (norm(p.name) === target) return p;
    if (p.udiscHandle && norm(p.udiscHandle) === target) return p;
  }
  for (const p of roster) {
    const pname = norm(p.name);
    const hname = p.udiscHandle ? norm(p.udiscHandle) : "";
    if (pname.includes(target) || target.includes(pname)) return p;
    if (hname && (hname.includes(target) || target.includes(hname))) return p;
  }
  for (const p of roster) {
    const pparts = norm(p.name).split(" ").filter(Boolean);
    if (pparts.some((pp) => targetParts.includes(pp) && pp.length >= 3)) return p;
  }
  return null;
}
