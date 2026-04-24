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
  warning?: string;
};

/**
 * UDisc scorecards are rendered by React Router. The round data ships as a
 * turbo-stream payload embedded in `window.__reactRouterContext.streamController.enqueue("...")`.
 * Rather than implementing the full turbo-stream decoder, we pull the raw
 * string and extract player records via regex. The stream contains two shapes:
 *   1. Keyed: "username","X","name","Y",...,"totalScore",N (first record)
 *   2. Compact: "X","Y","Z","img","img",score,["D",t],["D",t],place,toPar (subsequent)
 * If compact records lack `place`, we derive it by sorting on totalScore.
 */
export async function parseUdiscUrl(url: string): Promise<UdiscParseResult> {
  const fail = (warning: string): UdiscParseResult => ({ ok: false, url, entries: [], warning });
  let html: string;
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; DiscGolfLeagueBot/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return fail(`UDisc returned HTTP ${res.status}`);
    html = await res.text();
  } catch (e) {
    return fail(`Could not fetch UDisc page: ${(e as Error).message}`);
  }

  const payload = extractStream(html);
  if (!payload) return fail("Could not find scorecard data on page. Enter positions manually.");

  const courseName = payload.match(/"courseName","([^"]+)"/)?.[1];
  const layoutName = payload.match(/"layoutName","([^"]+)"/)?.[1];
  const dateMs = payload.match(/"endDate",\["D",(\d+)\]/)?.[1];
  const date = dateMs ? new Date(Number(dateMs)).toISOString().slice(0, 10) : undefined;

  // Weather: UDisc always ships temperature in Kelvin and wind speed in m/s,
  // regardless of the user's display unit preference.
  // "temperature",280.21,"humidity",...,"speed",1.54,"direction",...
  const tempK = Number(payload.match(/"temperature",(-?\d+(?:\.\d+)?)/)?.[1]);
  const windMps = Number(payload.match(/"wind",\{[^}]+\},"speed",(-?\d+(?:\.\d+)?)/)?.[1]);
  const temperatureC = Number.isFinite(tempK) ? Math.round((tempK - 273.15) * 10) / 10 : undefined;
  const windKph = Number.isFinite(windMps) ? Math.round(windMps * 3.6) : undefined;

  type Rec = { username: string; name?: string; score?: number; place?: number; toPar?: number; avatarUrl?: string };
  const players = new Map<string, Rec>();

  // Keyed form: "username","X" window has "name","Y" and "totalScore",N nearby
  const keyedRe = /"username","([^"]+)"/g;
  let km: RegExpExecArray | null;
  while ((km = keyedRe.exec(payload)) !== null) {
    const uname = km[1];
    const win = payload.slice(km.index, km.index + 3000);
    const nameM = win.match(/"name","([^"]+)"/);
    const scoreM = win.match(/"totalScore",(-?\d+)/);
    // "thumbnailImage","<hash>_T_Player-YYYYMMDD_HHMMSS.jpg","image","<hash>_Player-..."
    const thumbM = win.match(/"thumbnailImage","([^"]+\.(?:jpg|jpeg|png|webp))"/);
    const fullM = win.match(/"image","([^"]+\.(?:jpg|jpeg|png|webp))"/);
    const rec: Rec = { username: uname };
    if (nameM) rec.name = nameM[1];
    if (scoreM) rec.score = Number(scoreM[1]);
    const avatarFile = thumbM?.[1] ?? fullM?.[1];
    if (avatarFile) rec.avatarUrl = UDISC_CDN + avatarFile;
    if (rec.name || rec.score != null || rec.avatarUrl) players.set(uname, rec);
  }

  // Compact form (permissive image-filename class). Captures:
  //   score, position, relativeScore (to par)
  const compactRe =
    /"([a-zA-Z0-9_.]{3,40})","([^"]*)","([^"]*)","([^"]+\.(?:jpg|jpeg|png|webp|gif))","([^"]+\.(?:jpg|jpeg|png|webp|gif))",(-?\d+),\["D",\d+\],\["D",\d+\],(\d+),(-?\d+)/g;
  let cm: RegExpExecArray | null;
  while ((cm = compactRe.exec(payload)) !== null) {
    const [, uname, display, , thumbFile, , score, place, toPar] = cm;
    const cur = players.get(uname) ?? { username: uname };
    players.set(uname, {
      username: uname,
      name: cur.name || display || uname,
      score: cur.score ?? Number(score),
      place: Number(place),
      toPar: Number(toPar),
      avatarUrl: cur.avatarUrl ?? (thumbFile ? UDISC_CDN + thumbFile : undefined),
    });
  }

  // Derive missing positions from totalScore (ascending = better)
  const arr = [...players.values()];
  if (arr.some((p) => p.place == null)) {
    const ranked = arr
      .filter((p) => Number.isFinite(p.score))
      .sort((a, b) => (a.score as number) - (b.score as number));
    let lastScore: number | null = null;
    let lastPlace = 0;
    ranked.forEach((p, i) => {
      if (p.score === lastScore) p.place = lastPlace;
      else {
        p.place = i + 1;
        lastPlace = p.place;
        lastScore = p.score as number;
      }
    });
  }

  const entries: ParsedEntry[] = arr
    .filter((p) => p.place)
    .sort((a, b) => (a.place as number) - (b.place as number))
    .map((p) => ({
      rawName: p.name ?? p.username,
      username: p.username,
      position: p.place as number,
      score: p.score,
      relativeScore: p.toPar,
      avatarUrl: p.avatarUrl,
    }));

  if (entries.length < 2) return fail("Could not identify players in scorecard. Enter positions manually.");

  const course = courseName ? courseName + (layoutName ? ` — ${layoutName}` : "") : undefined;
  return { ok: true, url, courseName: course, layoutName, date, temperatureC, windKph, entries };
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
