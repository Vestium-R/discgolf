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

async function gemini(prompt: string): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_KEY;
  if (!apiKey) throw new Error("AI analysis not configured — add GOOGLE_AI_KEY to Vercel env vars.");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function recommendThrowAction(
  distFt: number,
  wind: string,
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

  const prompt = `You're a disc golf caddy preparing a bag for tomorrow's round.

Course: ${courseName}
Conditions: ${conditions || "typical conditions"}
${courseData ? `\nCourse data from UDisc:\n${courseData}` : ""}

Player's discs:
IN BAG:
${bagList || "(none)"}

IN STORAGE:
${storeList || "(none)"}

${courseData.includes("Hole") ? "Use the actual hole distances above to make specific recommendations." : `Use your knowledge of ${courseName} or general disc golf knowledge.`}

Recommend:
1. Which discs to bring (8-12 total, pulling from storage if needed) — list them
2. Call out 2-3 specific holes with which disc and why
3. What to leave home and why

Be direct, practical, specific. Under 240 words.`;

  try {
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
