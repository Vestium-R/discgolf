"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getUser } from "@/lib/auth";
import { getBagDiscs, getUserPrefs } from "@/lib/store";
import type { BagDisc } from "@/lib/types";
import { DISC_TYPE_LABELS } from "@/lib/types";
import { plasticStabOffset } from "@/lib/plastics-db";
import { DISC_DB } from "@/lib/discs-db";
import type { DiscType } from "@/lib/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function skillNote(maxDist: number): string {
  if (maxDist <= 175) return `Skill level: beginner (~${maxDist}ft max). Only recommend discs up to speed 4 — faster discs will fly unpredictably.`;
  if (maxDist <= 250) return `Skill level: recreational (~${maxDist}ft max). Discs up to speed 7 work well; anything faster behaves overstable for them.`;
  if (maxDist <= 320) return `Skill level: intermediate (~${maxDist}ft max). Discs up to speed 10 are appropriate; speed 12-14 risky.`;
  if (maxDist <= 380) return `Skill level: advanced (~${maxDist}ft max). Most discs up to speed 12 are usable.`;
  return `Skill level: expert (~${maxDist}ft max). All disc speeds usable.`;
}

function playStyleNote(playStyle: string, throwStyle: string): string {
  const parts: string[] = [`Throw style: ${throwStyle}.`];
  if (playStyle === "hyzer_flip") parts.push("Player loves hyzer flips — prefers understable discs ripped on hyzer that flip to flat for max distance.");
  else if (playStyle === "anhyzer") parts.push("Player prefers anhyzer/turnover lines and rollers — likes understable to neutral discs.");
  else if (playStyle === "beginner") parts.push("Player is still learning — prioritize forgiving, understable-to-neutral discs that fly predictably.");
  else parts.push("Player prefers flat releases and lets the disc's natural fade finish the shot.");
  return parts.join(" ");
}

function yearsNote(years?: number): string {
  if (!years) return "";
  if (years <= 1) return `Experience: ${years} year playing — newer player.`;
  if (years <= 3) return `Experience: ${years} years playing — developing player.`;
  if (years <= 7) return `Experience: ${years} years playing — experienced player.`;
  return `Experience: ${years} years playing — veteran.`;
}

/** Heavier discs fly more overstable; lighter more understable. Ref point: 175g. */
function weightNote(g?: number): string {
  if (!g) return "";
  if (g >= 173) return ` | ${g}g (max weight, slightly more OS)`;
  if (g >= 168) return ` | ${g}g (standard)`;
  if (g >= 160) return ` | ${g}g (mid-weight, slightly more US)`;
  return ` | ${g}g (light, noticeably more US — good for lower arm speeds)`;
}

/** Build a single disc line for the prompt — includes weight, plastic offset, and condition */
function discLine(d: BagDisc): string {
  const stab = (d.turn ?? 0) + (d.fade ?? 0);
  const stabStr = `stab ${stab >= 0 ? "+" : ""}${stab.toFixed(1)}`;
  const offset = plasticStabOffset(d.manufacturer, d.plastic ?? "");
  const plasticStr = d.plastic
    ? ` | ${d.plastic}${offset > 0 ? ` (+${offset} OS)` : offset < 0 ? ` (${offset} US)` : ""}`
    : "";
  const wt = weightNote(d.weightG);
  const condStr = d.notes ? ` | ${d.notes}` : "";
  const nick = d.nickname ? ` "${d.nickname}"` : "";
  return `• ${d.discName}${nick}${d.manufacturer ? ` (${d.manufacturer})` : ""} — ${DISC_TYPE_LABELS[d.type]} — ${d.speed}/${d.glide ?? "?"}/${d.turn ?? "?"}/${d.fade ?? "?"} — ${stabStr}${plasticStr}${wt}${condStr}`;
}

// ── Gemini setup ──────────────────────────────────────────────────────────────

const HARDCODED_MODELS: { name: string; apiVersion: string }[] = [
  { name: "gemini-2.5-flash-lite", apiVersion: "v1" },
  { name: "gemini-2.5-flash",      apiVersion: "v1" },
  { name: "gemini-2.0-flash",      apiVersion: "v1" },
];

let cachedModels: { name: string; apiVersion: string }[] = [];

async function findAvailableModels(apiKey: string): Promise<{ name: string; apiVersion: string }[]> {
  if (cachedModels.length) return cachedModels;
  const found: { name: string; apiVersion: string; priority: number }[] = [];
  for (const apiVersion of ["v1", "v1beta"]) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/${apiVersion}/models?key=${apiKey}`);
      if (!res.ok) continue;
      const data = await res.json() as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
      for (const m of data.models ?? []) {
        if (!(m.supportedGenerationMethods ?? []).includes("generateContent")) continue;
        if (!m.name.includes("flash") && !m.name.includes("pro")) continue;
        const name = m.name.replace("models/", "");
        if (name.includes("thinking") || name.includes("exp") || name.includes("preview")) continue;
        const priority =
          name.includes("2.5") && name.includes("flash") && name.includes("lite") ? 5 :
          name.includes("2.5") && name.includes("flash") ? 4 :
          name.includes("2.0") && name.includes("flash") ? 3 :
          name.includes("2.5") || name.includes("2.0") ? 2 :
          name.includes("1.5") ? -1 : 0;
        if (!found.some(f => f.name === name)) found.push({ name, apiVersion, priority });
      }
    } catch { /* try next */ }
  }
  found.sort((a, b) => b.priority - a.priority);
  cachedModels = found;
  return cachedModels;
}

async function gemini(prompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_KEY;
  if (!apiKey) throw new Error("AI not configured — add GOOGLE_AI_KEY to Vercel env vars.");
  const genAI = new GoogleGenerativeAI(apiKey);
  const discovered = await findAvailableModels(apiKey);
  const toTry = [...HARDCODED_MODELS, ...discovered.filter(d => !HARDCODED_MODELS.some(h => h.name === d.name))];
  let lastErr: Error = new Error("All models failed");
  for (const { name, apiVersion } of toTry) {
    try {
      const m = genAI.getGenerativeModel({ model: name }, { apiVersion });
      const result = await m.generateContent(prompt);
      return result.response.text();
    } catch (e) {
      const msg = (e as Error).message ?? "";
      if (msg.includes("503") || msg.includes("404") || msg.includes("429")) { lastErr = e as Error; continue; }
      throw e;
    }
  }
  throw new Error(`AI temporarily unavailable — try again shortly. (${lastErr.message.slice(0, 100)})`);
}

// ── Course data helpers ───────────────────────────────────────────────────────

async function fetchUdiscCourseBySlug(slug: string): Promise<string> {
  try {
    const res = await fetch(`https://udisc.com/courses/${slug}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; DiscGolfLeagueBot/1.0)", Accept: "text/html" },
    });
    if (!res.ok) return "";
    const html = await res.text();
    const streamMatch = html.match(/streamController\.enqueue\("((?:[^"\\]|\\.)+)"\)/);
    if (!streamMatch) return "";
    const decoded = JSON.parse('"' + streamMatch[1] + '"');
    const arr = JSON.parse(decoded) as unknown[];
    const holesKeyIdx = arr.indexOf("holes");
    if (holesKeyIdx === -1) return "";
    let holeIndices: number[] | null = null;
    for (let j = holesKeyIdx + 1; j < Math.min(holesKeyIdx + 10, arr.length); j++) {
      const v = arr[j];
      if (Array.isArray(v) && v.length > 0 && typeof v[0] === "number") { holeIndices = v as number[]; break; }
    }
    if (!holeIndices) return "";
    function getField(obj: unknown, field: string): unknown {
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) return undefined;
      const o = obj as Record<string, unknown>;
      if (field in o) return o[field];
      for (const [k, v] of Object.entries(o)) {
        if (!k.startsWith("_")) continue;
        if (arr[parseInt(k.slice(1))] === field) return typeof v === "number" && v >= 0 ? arr[v] : v;
      }
      return undefined;
    }
    const holes = holeIndices.map((idx, i) => {
      const distM = getField(arr[idx], "distance");
      return typeof distM === "number" && distM > 0 ? `Hole ${i + 1}: ${Math.round(distM * 3.28084)}ft` : null;
    }).filter(Boolean);
    return holes.length > 0 ? `Hole distances:\n${holes.join("\n")}` : "";
  } catch { return ""; }
}

async function fetchUdiscCourseData(courseName: string): Promise<string> {
  try {
    const res = await fetch(`https://udisc.com/courses?query=${encodeURIComponent(courseName)}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; DiscGolfLeagueBot/1.0)", Accept: "text/html" },
    });
    if (!res.ok) return "";
    const html = await res.text();
    const slugM = html.match(/href="\/courses\/([a-z0-9-]+(?:-[a-zA-Z0-9]+)+)"/);
    if (!slugM) return "";
    return await fetchUdiscCourseBySlug(slugM[1]);
  } catch { return ""; }
}

// ── Public actions ────────────────────────────────────────────────────────────


export async function analyzeBagDiscsAction(
  discs: BagDisc[],
  playerMaxDist = 300,
  playStyle = "flat",
  throwStyle = "RHBH",
  yearsPlaying?: number,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  if (discs.length < 3) return { ok: false, error: "Add at least 3 discs for a useful analysis." };
  const apiKey = process.env.GOOGLE_AI_KEY;
  if (!apiKey) return { ok: false, error: "AI not configured — add GOOGLE_AI_KEY to Vercel env vars." };

  const byType = (t: BagDisc["type"]) => discs.filter(d => d.type === t);
  const stab = (d: BagDisc) => (d.turn ?? 0) + (d.fade ?? 0);
  const os = discs.filter(d => stab(d) > 1).length;
  const neu = discs.filter(d => stab(d) >= -0.5 && stab(d) <= 1).length;
  const us = discs.filter(d => stab(d) < -0.5).length;

  const prompt = `You're a supportive disc golf coach reviewing a student's bag. Be encouraging, specific, and practical.

Player bag (${discs.length} discs):
${discs.map(discLine).join("\n")}

Breakdown: ${byType("putter").length} putters, ${byType("midrange").length} midranges, ${byType("fairway_driver").length} fairways, ${byType("distance_driver").length} distance drivers
Stability split: ${os} overstable | ${neu} neutral | ${us} understable
${playStyleNote(playStyle, throwStyle)}
${skillNote(playerMaxDist)}
${yearsNote(yearsPlaying)}

Coaching response in 2-3 short paragraphs:
1. What this bag says about how they play — be specific and read the stability spread alongside their stated style.
2. If any, name the one or two biggest gaps. Name specific discs with flight numbers they'd benefit from. One gap per item.
3. One thing they're doing right — name a specific disc and why it's a smart choice for their style.

Tone: encouraging, like a coach who's played 20 years. No bullet lists. Under 250 words.`;

  try {
    return { ok: true, text: await gemini(prompt) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function recommendThrowAction(
  distFt: number,
  wind: string,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sign in required" };
  const [discs, prefs] = await Promise.all([
    getBagDiscs(user.id).then(d => d.filter(x => !x.inStorage)),
    getUserPrefs(user.id),
  ]);
  const playerMaxDist = prefs.maxDistFt;
  if (discs.length < 2) return { ok: false, error: "Add more discs to your bag first." };

  const prompt = `You're a disc golf caddy. Player's bag:
${discs.map(discLine).join("\n")}

Shot: ${distFt} feet | Conditions: ${wind}
${playStyleNote(prefs.playStyle, prefs.throwStyle)}
${skillNote(playerMaxDist)}

Pick 2-3 discs from their bag by name. For each:
- Why it fits this shot (including plastic stability if relevant)
- Release angle (flat/hyzer/anhyzer) given their style
- Power level
Be direct. Under 130 words total.`;

  try {
    return { ok: true, text: await gemini(prompt) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function recommendDiscAction(opts: {
  type?: DiscType | "";
  stab?: string;
  brand?: string;
  plastic?: string;
  description?: string;
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sign in required" };

  const [userDiscs, prefs] = await Promise.all([getBagDiscs(user.id), getUserPrefs(user.id)]);
  const apiKey = process.env.GOOGLE_AI_KEY;
  if (!apiKey) return { ok: false, error: "AI not configured." };

  // Filter the disc database based on selections
  const stabFilter = (stab: number) => {
    if (opts.stab === "os") return stab > 1;
    if (opts.stab === "neutral") return stab >= -0.5 && stab <= 1;
    if (opts.stab === "us") return stab < -0.5;
    return true;
  };

  const candidates = DISC_DB
    .filter(d => !opts.type || d.type === opts.type)
    .filter(d => stabFilter((d.turn ?? 0) + (d.fade ?? 0)))
    .filter(d => !opts.brand || d.manufacturer.toLowerCase().includes(opts.brand.toLowerCase()))
    // plastic filter is passed to AI as context, not filtered here (disc DB doesn't have plastic)
    .slice(0, 40)
    .map(d => `• ${d.name} (${d.manufacturer}) — ${DISC_TYPE_LABELS[d.type as DiscType]} — ${d.speed}/${d.glide}/${d.turn}/${d.fade}`)
    .join("\n");

  const owned = userDiscs.filter(d => !d.inStorage).map(d => `${d.discName} (${d.manufacturer ?? ""})`).join(", ");
  const stored = userDiscs.filter(d => d.inStorage).map(d => `${d.discName}`).join(", ");

  const stab = (d: BagDisc) => (d.turn ?? 0) + (d.fade ?? 0);
  const os = userDiscs.filter(d => stab(d) > 1).length;
  const us = userDiscs.filter(d => stab(d) < -0.5).length;
  const neu = userDiscs.filter(d => stab(d) >= -0.5 && stab(d) <= 1).length;

  const prompt = `You're a disc golf shop expert helping a player find a disc to buy. Recommend 2-3 specific discs they don't already own.

Player profile:
${playStyleNote(prefs.playStyle, prefs.throwStyle)}
${skillNote(prefs.maxDistFt ?? 300)}

Current bag: ${owned || "(empty)"}
Storage: ${stored || "(none)"}
Bag stability spread: ${os} overstable | ${neu} neutral | ${us} understable

What they're looking for:
Type: ${opts.type ? DISC_TYPE_LABELS[opts.type as DiscType] : "Any"}
Stability: ${opts.stab || "any"}
Brand preference: ${opts.brand || "no preference"}
Plastic preference: ${opts.plastic || "no preference"}
Description: ${opts.description || "not specified"}

Discs available matching those filters (from a database of 400+):
${candidates || "(no exact matches — broaden your filters)"}

Recommend 2-3 discs from the list above. For each:
1. Name, manufacturer, flight numbers
2. Why it fits their style, skill level, and the gap they described
3. One sentence on how to throw it given their play style

Don't recommend anything they already own. Be specific and practical. Under 200 words.`;

  try {
    return { ok: true, text: await gemini(prompt) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function analyzeBagFollowUpAction(
  bagDiscs: BagDisc[],
  storageDiscs: BagDisc[],
  playerMaxDist = 300,
  playStyle = "flat",
  throwStyle = "RHBH",
  yearsPlaying: number | undefined,
  priorAnalysis: string,
  question: string,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const apiKey = process.env.GOOGLE_AI_KEY;
  if (!apiKey) return { ok: false, error: "AI not configured." };

  const bagContext = bagDiscs.map(discLine).join("\n");
  const playerCtx = [
    playStyleNote(playStyle, throwStyle),
    skillNote(playerMaxDist),
    yearsNote(yearsPlaying),
  ].filter(Boolean).join("\n");

  let prompt: string;

  if (question === "unbag") {
    prompt = `You're a disc golf coach. The player received this bag analysis:
"${priorAnalysis}"

Their current bag:
${bagContext}
${playerCtx}

Which single disc should they consider removing? Name it and give one clear reason — redundancy, wrong fit for their style, or outclassed by another disc they own. 2-3 sentences max.`;

  } else if (question === "storage") {
    const storeContext = storageDiscs.length > 0
      ? storageDiscs.map(discLine).join("\n")
      : "(no discs in storage)";
    prompt = `You're a disc golf coach. The player received this bag analysis:
"${priorAnalysis}"

In bag:
${bagContext}

In storage:
${storeContext}

${playerCtx}

Is there a specific disc in their storage that would better fill a gap in their bag? If yes, name it and explain why it fits the gap better than what's currently bagged. If nothing in storage improves their setup, say so honestly. 2-3 sentences max.`;

  } else if (question === "versatile") {
    prompt = `You're a disc golf coach. Look at this player's bag:
${bagContext}
${playerCtx}

Which single disc in their bag is the most versatile — handles the widest variety of shots and situations for their throw style and skill level? Name it and explain why in 2-3 sentences.`;

  } else if (question === "gap") {
    const byType = (t: BagDisc["type"]) => bagDiscs.filter(d => d.type === t);
    const stab = (d: BagDisc) => (d.turn ?? 0) + (d.fade ?? 0);
    const os = bagDiscs.filter(d => stab(d) > 1).length;
    const neu = bagDiscs.filter(d => stab(d) >= -0.5 && stab(d) <= 1).length;
    const us = bagDiscs.filter(d => stab(d) < -0.5).length;

    prompt = `You're a disc golf coach. The player received this bag analysis:
"${priorAnalysis}"

Their bag:
${bagContext}
Breakdown: ${byType("putter").length} putters, ${byType("midrange").length} midranges, ${byType("fairway_driver").length} fairways, ${byType("distance_driver").length} distance drivers
Stability: ${os} overstable | ${neu} neutral | ${us} understable
${playerCtx}

What's the single biggest type or stability gap given their play style? Name the specific type (e.g. "understable fairway driver") and suggest one real disc with flight numbers they should consider adding. 2-3 sentences max.`;

  } else {
    return { ok: false, error: "Unknown follow-up question." };
  }

  try {
    return { ok: true, text: await gemini(prompt) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function planCourseAction(
  courseName: string,
  conditions: string,
  courseSlug?: string,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sign in required" };
  const [allDiscs, prefs] = await Promise.all([
    getBagDiscs(user.id),
    getUserPrefs(user.id),
  ]);
  const playerMaxDist = prefs.maxDistFt;
  if (allDiscs.length === 0) return { ok: false, error: "Add discs to your bag first." };

  const bagDiscs   = allDiscs.filter(d => !d.inStorage);
  const storeDiscs = allDiscs.filter(d =>  d.inStorage);
  const courseData = courseSlug
    ? await fetchUdiscCourseBySlug(courseSlug)
    : await fetchUdiscCourseData(courseName);

  const prompt = `You're a disc golf caddy building a bag for tomorrow's round. Use what the player owns — flag a gap only if nothing fits.

${playStyleNote(prefs.playStyle, prefs.throwStyle)}
${skillNote(playerMaxDist)}
${yearsNote(prefs.yearsPlaying)}

Course: ${courseName} | Conditions: ${conditions || "typical"}
${courseData ? `\n${courseData}` : ""}

IN BAG:
${bagDiscs.map(discLine).join("\n") || "(none)"}

IN STORAGE:
${storeDiscs.map(discLine).join("\n") || "(none)"}

Instructions:
1. Get context around the discs in the bag and in storage. 2 discs with the same flight numbers are likely very similar.
2. Get context of the course. Technical courses generally need more shot variety type.
3. Keep bag discs that suit the course. Suggest specific storage swaps if better suited — name them.
4. If something should be left at home, suggest it and why only from their current bag.
5. If there's a genuine gap no disc fills, one line: "Gap: consider adding a [description]" — no brand names.
6. Call out 2-3 specific holes (by number if distances available) with which disc to use and why.
7. Account for plastic stability offsets where relevant (e.g. beat-in disc plays more understable).

Direct and practical. Under 240 words.`;

  try {
    return { ok: true, text: await gemini(prompt) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
