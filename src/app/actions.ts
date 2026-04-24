"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth";
import {
  deleteRound,
  getRoster,
  getSettings,
  insertRound,
  saveSettings,
  upsertPlayer,
} from "@/lib/store";
import type { Round, RoundResult } from "@/lib/types";
import { slug } from "@/lib/slug";

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

export async function previewUdiscAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const url = String(formData.get("udiscUrl") ?? "").trim();
  redirect(`/admin/rounds/new?${new URLSearchParams({ udiscUrl: url }).toString()}`);
}

export async function submitRoundAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const date = String(formData.get("date") ?? "").trim();
  const source = String(formData.get("source") ?? "manual") as "udisc" | "manual";
  const udiscUrl = String(formData.get("udiscUrl") ?? "").trim() || undefined;
  const courseName = String(formData.get("courseName") ?? "").trim() || undefined;
  const note = String(formData.get("note") ?? "").trim() || undefined;

  const roster = await getRoster();
  const settings = await getSettings();

  const results: RoundResult[] = [];
  for (const p of roster) {
    const raw = String(formData.get(`pos_${p.id}`) ?? "").trim();
    if (!raw) continue;
    const pos = Number(raw);
    if (!Number.isFinite(pos) || pos < 1) continue;
    results.push({ playerId: p.id, position: pos });
  }

  if (results.length < 2) redirect("/admin/rounds/new?err=toofew");

  const season = Number(formData.get("season")) || settings.currentSeason;
  const id = `${date}-${Math.random().toString(36).slice(2, 8)}`;
  const round: Round = {
    id,
    date: date || new Date().toISOString().slice(0, 10),
    season,
    source,
    udiscUrl,
    courseName,
    note,
    results,
    createdAt: new Date().toISOString(),
  };
  await insertRound(round);
  revalidatePath("/");
  revalidatePath("/rounds");
  redirect(`/rounds/${id}`);
}

export async function deleteRoundAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await deleteRound(id);
  revalidatePath("/");
  revalidatePath("/rounds");
  redirect("/rounds");
}

type CookieToSet = { name: string; value: string; options?: Parameters<Awaited<ReturnType<typeof cookies>>["set"]>[2] };

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

function uniqueId(base: string, taken: string[]): string {
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
