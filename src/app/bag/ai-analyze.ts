"use server";
import Anthropic from "@anthropic-ai/sdk";
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

export async function analyzeBagAction(): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const user = await getUser();
  if (!user) return { ok: false, error: "Sign in required" };

  const discs = await getBagDiscs(user.id);
  if (discs.length < 3) return { ok: false, error: "Add at least 3 discs to get an analysis." };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "AI analysis not configured." };

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [{ role: "user", content: buildPrompt(discs) }],
    });
    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");
    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
