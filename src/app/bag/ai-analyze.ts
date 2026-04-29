"use server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getUser } from "@/lib/auth";
import { getBagDiscs } from "@/lib/store";
import type { BagDisc } from "@/lib/types";
import { DISC_TYPE_LABELS } from "@/lib/types";

function buildPrompt(discs: BagDisc[]): string {
  const byType = (t: BagDisc["type"]) => discs.filter((d) => d.type === t);
  const putters  = byType("putter");
  const mids     = byType("midrange");
  const fairways = byType("fairway_driver");
  const distance = byType("distance_driver");

  const stab = (d: BagDisc) => (d.turn ?? 0) + (d.fade ?? 0);
  const all = discs;
  const os  = all.filter((d) => stab(d) > 1);
  const neu = all.filter((d) => stab(d) >= -0.5 && stab(d) <= 1);
  const us  = all.filter((d) => stab(d) < -0.5);

  const discList = discs.map((d) =>
    `  • ${d.discName}${d.manufacturer ? ` (${d.manufacturer})` : ""} — ${DISC_TYPE_LABELS[d.type]} — ${d.speed}/${d.glide ?? "?"}/${d.turn ?? "?"}/${d.fade ?? "?"} — stability: ${stab(d) > 0 ? "+" : ""}${stab(d).toFixed(1)}`
  ).join("\n");

  return `You are an expert disc golf bag consultant. Analyze this player's bag and give smart, specific, honest recommendations.

BAG CONTENTS (${discs.length} discs):
${discList}

SUMMARY:
- Putters: ${putters.length} | Midranges: ${mids.length} | Fairway drivers: ${fairways.length} | Distance drivers: ${distance.length}
- Overstable (stability > 1): ${os.length} disc${os.length !== 1 ? "s" : ""}
- Neutral (-0.5 to 1): ${neu.length} disc${neu.length !== 1 ? "s" : ""}
- Understable (< -0.5): ${us.length} disc${us.length !== 1 ? "s" : ""}

Analyze this bag honestly. Consider:
1. What the stability distribution reveals about playing style (e.g. heavy understable = likely a hyzer flip thrower OR a beginner, heavy overstable = control/wind player). Be specific about what it implies.
2. What's genuinely missing — not just categories, but specific shot shapes and conditions that aren't covered (headwind, tailwind, wooded, tight fairways, hyzer, anhyzer, rollers, etc.)
3. Concrete disc recommendations by name to fill real gaps — name actual discs with flight numbers.
4. Any redundancies — if they have 4 nearly identical discs, say so.

Format: short paragraphs (not bullet points). Be direct and practical. Under 300 words. Don't pad.`;
}

// Hardcoded preference: 1.5-flash-8b and 1.5-flash on v1 are reliably free.
// 2.0+ models show in ListModels but have limit:0 on free tier.
const HARDCODED_MODELS: { name: string; apiVersion: string }[] = [
  { name: "gemini-1.5-flash-8b", apiVersion: "v1" },
  { name: "gemini-1.5-flash",    apiVersion: "v1" },
  { name: "gemini-1.5-pro",      apiVersion: "v1" },
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
        // Prefer 1.5-flash-8b → 1.5-flash → 1.5-pro → anything else.
        // Explicitly deprioritise 2.0+ models — they have limit:0 on free tier.
        const is2x  = name.includes("2.0") || name.includes("2.5");
        const is8b  = name.includes("8b");
        const is15  = name.includes("1.5");
        const priority = is2x ? -1 : is8b && is15 ? 3 : is15 ? 2 : 0;
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
  // Try hardcoded free-tier models first, then fall back to auto-discovered ones
  const discovered = await findAvailableModels(apiKey);
  const toTry = [...HARDCODED_MODELS, ...discovered.filter(
    d => !HARDCODED_MODELS.some(h => h.name === d.name)
  )];
  let lastErr: Error = new Error("All models failed");
  for (const { name, apiVersion } of toTry) {
    try {
      const m = genAI.getGenerativeModel({ model: name }, { apiVersion });
      const result = await m.generateContent(prompt);
      return result.response.text();
    } catch (e) {
      const msg = (e as Error).message ?? "";
      if (msg.includes("503") || msg.includes("404") || msg.includes("429")) {
        lastErr = e as Error; continue;
      }
      throw e;
    }
  }
  throw new Error(`AI temporarily unavailable. Try again shortly. (${lastErr.message.slice(0, 120)})`);
}

export async function recommendThrowAction(
  distFt: number,
  wind: string,
  playerMaxDist = 300,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sign in required" };
  const discs = (await getBagDiscs(user.id)).filter((d) => !d.inStorage);
  if (discs.length < 2) return { ok: false, error: "Add more discs to your bag first." };

  const discList = discs
    .map((d) => `• ${d.discName}${d.manufacturer ? ` (${d.manufacturer})` : ""} — ${DISC_TYPE_LABELS[d.type]} — ${d.speed}/${d.glide ?? "?"}/${d.turn ?? "?"}/${d.fade ?? "?"}`)
    .join("\n");

  const prompt = `You're a disc golf caddy. The player's bag:

${discList}

Shot: ${distFt} feet, conditions: ${wind}
${skillNote(playerMaxDist)}

Pick 2-3 discs from their bag by name. For each: why it fits, suggested release angle (flat/hyzer/anhyzer), and power level. Be direct, under 120 words total.`;

  try {
    return { ok: true, text: await gemini(prompt) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

async function fetchUdiscCourseBySlug(slug: string): Promise<string> {
  try {
    const res = await fetch(`https://udisc.com/courses/${slug}`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; DiscGolfLeagueBot/1.0)", Accept: "text/html" },
    });
    if (!res.ok) return "";
    const html = await res.text();
    const nextData = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/)?.[1];
    if (!nextData) return "";
    const str = JSON.stringify(JSON.parse(nextData));
    const holes: string[] = [];
    for (const m of str.matchAll(/"holeNumber":(\d+)[^}]*?"distance":(\d+)/g)) {
      holes.push(`Hole ${m[1]}: ${m[2]}ft`);
    }
    return holes.length > 0
      ? `UDisc data:\n${holes.slice(0, 18).join("\n")}`
      : `Found course (slug: ${slug}) but hole distances not available.`;
  } catch { return ""; }
}

async function fetchUdiscCourseData(courseName: string): Promise<string> {
  // Search UDisc for the course and pull hole data from the first result
  try {
    const searchUrl = `https://udisc.com/courses?query=${encodeURIComponent(courseName)}`;
    const res = await fetch(searchUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; DiscGolfLeagueBot/1.0)", Accept: "text/html" },
      redirect: "follow",
    });
    if (!res.ok) return "";
    const html = await res.text();

    // Try to extract course slug from search results
    const slugM = html.match(/href="\/courses\/([a-z0-9-]+(?:-[a-zA-Z0-9]+)+)"/);
    if (!slugM) return "";

    const courseUrl = `https://udisc.com/courses/${slugM[1]}`;
    const courseRes = await fetch(courseUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; DiscGolfLeagueBot/1.0)", Accept: "text/html" },
    });
    if (!courseRes.ok) return "";
    const courseHtml = await courseRes.text();

    // Extract hole distances from the page (UDisc embeds these in __NEXT_DATA__ or similar)
    const nextData = courseHtml.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]+)<\/script>/)?.[1];
    if (!nextData) return `Found course at ${courseUrl} but couldn't extract hole data.`;

    const data = JSON.parse(nextData);
    // Navigate the Next.js data structure to find holes
    const str = JSON.stringify(data);
    const holes: string[] = [];
    const holeMatches = str.matchAll(/"holeNumber":(\d+)[^}]*?"distance":(\d+)/g);
    for (const m of holeMatches) {
      holes.push(`Hole ${m[1]}: ${m[2]}ft`);
    }
    if (holes.length > 0) return `Course: ${courseUrl}\nHoles:\n${holes.slice(0, 18).join("\n")}`;
    return `Found course at ${courseUrl} (hole distances not available in page data).`;
  } catch {
    return "";
  }
}

export async function planCourseAction(
  courseName: string,
  conditions: string,
  courseSlug?: string,
  playerMaxDist = 300,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sign in required" };
  const allDiscs = await getBagDiscs(user.id);
  if (allDiscs.length === 0) return { ok: false, error: "Add discs to your bag first." };

  const fmt = (d: BagDisc) =>
    `${d.discName}${d.manufacturer ? ` (${d.manufacturer})` : ""} ${d.speed}/${d.glide ?? "?"}/${d.turn ?? "?"}/${d.fade ?? "?"} — ${DISC_TYPE_LABELS[d.type]}`;

  const bagList = allDiscs.filter((d) => !d.inStorage).map(fmt).join("\n");
  const storeList = allDiscs.filter((d) => d.inStorage).map(fmt).join("\n");

  // Fetch real course data: use known slug directly, or search by name
  const courseData = courseSlug
    ? await fetchUdiscCourseBySlug(courseSlug)
    : await fetchUdiscCourseData(courseName);

  const prompt = `You're a disc golf caddy building a bag for tomorrow's round. Your job is to use what the player already owns — only flag a gap if NONE of their discs can fill a role.

${skillNote(playerMaxDist)}
Course: ${courseName}
Conditions: ${conditions || "typical conditions"}
${courseData ? `\nCourse data from UDisc:\n${courseData}` : ""}

Player's discs:
IN BAG (already packed):
${bagList || "(none)"}

IN STORAGE (available to swap in):
${storeList || "(none)"}

Instructions:
1. Start with what's in the bag. Keep anything that fits the course.
2. Suggest swapping in specific storage discs if they're better suited — name them explicitly.
3. Suggest leaving home anything redundant or unsuitable — name them.
4. Only after reviewing everything they own: if there's a genuine gap no disc fills (e.g. no overstable fairway for a dogleg), say "Gap: consider adding a [description]" — one line, no brand recommendations.
5. Call out 2–3 specific holes (by number if UDisc data available) with which of THEIR discs to use and why.

Be direct. Prefer concrete disc names over generic advice. Under 230 words.`;

  try {
    return { ok: true, text: await gemini(prompt) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

function skillNote(maxDist: number): string {
  if (maxDist <= 175) return `Player skill: beginner (~${maxDist}ft max). Only recommend discs up to speed 4. Higher speeds will fly unpredictably for them.`;
  if (maxDist <= 250) return `Player skill: recreational (~${maxDist}ft max). Discs up to speed 7 work well; faster discs will behave overstable for them.`;
  if (maxDist <= 320) return `Player skill: intermediate (~${maxDist}ft max). Discs up to speed 10 are appropriate; speed 12-14 still risky.`;
  if (maxDist <= 380) return `Player skill: advanced (~${maxDist}ft max). Most discs up to speed 12 are usable.`;
  return `Player skill: expert (~${maxDist}ft max). All disc speeds usable.`;
}

export async function analyzeBagDiscsAction(
  discs: BagDisc[],
  playerMaxDist = 300,
): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  if (discs.length < 3) return { ok: false, error: "Add at least 3 discs for a useful analysis." };
  const apiKey = process.env.GOOGLE_AI_KEY;
  if (!apiKey) return { ok: false, error: "AI not configured — add GOOGLE_AI_KEY to Vercel env vars." };
  try {
    const prompt = buildPrompt(discs) + `\n\n${skillNote(playerMaxDist)}`;
    return { ok: true, text: await gemini(prompt) };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function analyzeBagAction(): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sign in required" };

  const discs = await getBagDiscs(user.id);
  if (discs.length < 3) return { ok: false, error: "Add at least 3 discs to get an analysis." };

  const apiKey = process.env.GOOGLE_AI_KEY;
  if (!apiKey) return { ok: false, error: "AI analysis not configured — add GOOGLE_AI_KEY to Vercel env vars." };

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(buildPrompt(discs));
    const text = result.response.text();
    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
