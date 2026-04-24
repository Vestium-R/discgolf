"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import {
  deleteRound,
  getRoster,
  getRounds,
  getSettings,
  insertRound,
  saveSettings,
  updateRoundCounts,
  updateRoundVariant,
  updateRoundWeather,
  upsertPlayer,
} from "@/lib/store";
import type { Round, RoundResult, RoundVariant } from "@/lib/types";
import { fToC } from "@/lib/conditions";
import { slug } from "@/lib/slug";
import { parseUdiscUrl, matchPlayer } from "@/lib/udisc";

type CookieToSet = { name: string; value: string; options?: Parameters<Awaited<ReturnType<typeof cookies>>["set"]>[2] };

// ────────────────────────────────
// Public actions (no auth required)
// ────────────────────────────────

export async function previewUdiscAction(formData: FormData): Promise<void> {
  const url = String(formData.get("udiscUrl") ?? "").trim();
  if (!url) redirect("/add?err=nourl");
  redirect(`/add?${new URLSearchParams({ udiscUrl: url }).toString()}`);
}

export async function submitRoundAction(formData: FormData): Promise<void> {
  const date = String(formData.get("date") ?? "").trim();
  const source = String(formData.get("source") ?? "manual") as "udisc" | "manual";
  const udiscUrl = String(formData.get("udiscUrl") ?? "").trim() || undefined;
  const courseName = String(formData.get("courseName") ?? "").trim() || undefined;
  const note = String(formData.get("note") ?? "").trim() || undefined;
  const roundId = String(formData.get("roundId") ?? "").trim() || undefined;
  const tempRaw = String(formData.get("temperature") ?? "").trim();
  const tempUnit = String(formData.get("tempUnit") ?? "C").trim().toUpperCase();
  const windRaw = String(formData.get("windMph") ?? "").trim();
  let temperatureC: number | undefined;
  if (tempRaw && Number.isFinite(Number(tempRaw))) {
    const n = Number(tempRaw);
    temperatureC = tempUnit === "F" ? fToC(n) : n;
  }
  const windMph = windRaw && Number.isFinite(Number(windRaw)) ? Number(windRaw) : undefined;

  const [roster, settings, existing] = await Promise.all([getRoster(), getSettings(), getRounds()]);

  const results: RoundResult[] = [];
  for (const p of roster) {
    const raw = String(formData.get(`pos_${p.id}`) ?? "").trim();
    if (!raw) continue;
    const pos = Number(raw);
    if (!Number.isFinite(pos) || pos < 1) continue;
    results.push({ playerId: p.id, position: pos });
  }

  if (results.length < 2) redirect("/add?err=toofew");

  const season = Number(formData.get("season")) || settings.currentSeason;

  const finalId = roundId ?? `${date}-${Math.random().toString(36).slice(2, 8)}`;
  if (existing.some((r) => r.id === finalId)) {
    revalidatePath("/");
    redirect(`/rounds/${finalId}?dup=1`);
  }

  const round: Round = {
    id: finalId,
    date: date || new Date().toISOString().slice(0, 10),
    season,
    source,
    udiscUrl,
    courseName,
    note,
    variant: "standard",
    counts: true,
    temperatureC,
    windMph,
    results,
    createdAt: new Date().toISOString(),
  };
  await insertRound(round);
  revalidatePath("/");
  revalidatePath("/rounds");
  redirect(`/rounds/${finalId}?new=1`);
}

// ────────────────────────────────
// Admin actions (require admin email)
// ────────────────────────────────

export async function addPlayerAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const udiscHandle = String(formData.get("udiscHandle") ?? "").trim();
  if (!name) return;
  const roster = await getRoster();
  const id = uniqueId(slug(name), roster.map((p) => p.id));
  await upsertPlayer({ id, name, udiscHandle: udiscHandle || undefined, active: true });
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function togglePlayerActiveAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const roster = await getRoster();
  const p = roster.find((x) => x.id === id);
  if (!p) return;
  await upsertPlayer({ ...p, active: !p.active });
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function updatePlayerAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const udiscHandle = String(formData.get("udiscHandle") ?? "").trim();
  const roster = await getRoster();
  const p = roster.find((x) => x.id === id);
  if (!p) return;
  await upsertPlayer({ ...p, name: name || p.name, udiscHandle: udiscHandle || undefined });
  revalidatePath("/admin");
}

export async function updateSeasonAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const year = Number(formData.get("currentSeason") ?? 0);
  if (!year || year < 2000 || year > 2100) return;
  await saveSettings({ currentSeason: year });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function updateSeasonConfigAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const season = Number(formData.get("season") ?? 0);
  if (!season) redirect("/admin?err=badseason");
  const initialBadgeHolderPlayerId = String(formData.get("initialBadgeHolderPlayerId") ?? "").trim() || undefined;
  const badgeImageUrl = String(formData.get("badgeImageUrl") ?? "").trim() || undefined;
  const championPlayerId = String(formData.get("championPlayerId") ?? "").trim() || undefined;
  const championName = String(formData.get("championName") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || undefined;
  const { upsertSeasonHistory, getRoster } = await import("@/lib/store");
  const roster = await getRoster();
  const championFromId = championPlayerId ? roster.find((p) => p.id === championPlayerId)?.name : undefined;
  try {
    await upsertSeasonHistory({
      season,
      championPlayerId,
      championName: championName || championFromId || "",
      note,
      badgeImageUrl,
      initialBadgeHolderPlayerId,
    });
  } catch (e) {
    redirect(`/admin?err=${encodeURIComponent((e as Error).message.slice(0, 200))}`);
  }
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/seasons/${season}`);
  redirect("/admin?ok=1");
}

export async function deleteRoundAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await deleteRound(id);
  revalidatePath("/");
  revalidatePath("/rounds");
  redirect("/rounds");
}

export async function updateRoundVariantAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const variant = String(formData.get("variant") ?? "standard") as RoundVariant;
  if (!["standard", "chiplocked", "legends", "other"].includes(variant)) return;
  await updateRoundVariant(id, variant);
  revalidatePath("/");
  revalidatePath("/rounds");
  revalidatePath(`/rounds/${id}`);
}

export async function updateRoundWeatherAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const tempRaw = String(formData.get("temperature") ?? "").trim();
  const tempUnit = String(formData.get("tempUnit") ?? "C").trim().toUpperCase();
  const windRaw = String(formData.get("windMph") ?? "").trim();
  let tempC: number | null = null;
  if (tempRaw !== "") {
    const n = Number(tempRaw);
    if (!Number.isFinite(n)) return;
    tempC = tempUnit === "F" ? fToC(n) : n;
  }
  const wind = windRaw === "" ? null : Number(windRaw);
  if (wind !== null && !Number.isFinite(wind)) return;
  await updateRoundWeather(id, tempC, wind);
  revalidatePath(`/rounds/${id}`);
  revalidatePath("/rounds");
}

export async function updateRoundCountsAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const counts = formData.get("counts") === "1";
  await updateRoundCounts(id, counts);
  revalidatePath("/");
  revalidatePath("/rounds");
  revalidatePath(`/rounds/${id}`);
}

export async function signOutAction(): Promise<void> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (all: CookieToSet[]) => {
          for (const c of all) cookieStore.set(c.name, c.value, c.options);
        },
      },
    }
  );
  await supabase.auth.signOut();
  redirect("/admin");
}

// Helpers

export async function udiscRoundIdFromUrl(url: string): Promise<string | null> {
  const m = url.match(/\/scorecards\/([A-Za-z0-9_-]+)/);
  return m?.[1] ?? null;
}

function uniqueId(base: string, taken: string[]): string {
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

// Preview helper (pure) — called by the /add page
export async function previewForm(url: string) {
  const roster = await getRoster();
  const res = await parseUdiscUrl(url);
  if (!res.ok) return { ok: false as const, warning: res.warning ?? "Could not parse" };
  const matches = res.entries.map((e) => ({
    ...e,
    suggestedPlayerId: matchPlayer(e.rawName, roster, e.username)?.id ?? null,
  }));
  return { ok: true as const, result: res, roster, matches };
}
