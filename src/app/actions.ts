"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin, signInAdmin, signOutAdmin } from "@/lib/auth";
import {
  addRound,
  deleteRound,
  getRoster,
  getSettings,
  saveRoster,
  saveSettings,
} from "@/lib/store";
import type { Round, RoundResult } from "@/lib/types";
import { slug } from "@/lib/slug";

function requireAdminOrThrow(admin: boolean): void {
  if (!admin) throw new Error("Not authorized");
}

export async function loginAction(formData: FormData): Promise<void> {
  const pw = String(formData.get("password") ?? "");
  const ok = await signInAdmin(pw);
  if (!ok) redirect("/admin?err=1");
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await signOutAdmin();
  redirect("/admin");
}

export async function addPlayerAction(formData: FormData): Promise<void> {
  requireAdminOrThrow(await isAdmin());
  const name = String(formData.get("name") ?? "").trim();
  const udiscHandle = String(formData.get("udiscHandle") ?? "").trim();
  if (!name) return;
  const roster = await getRoster();
  const id = uniqueId(slug(name), roster.map((p) => p.id));
  roster.push({ id, name, udiscHandle: udiscHandle || undefined, active: true });
  await saveRoster(roster);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function togglePlayerActiveAction(formData: FormData): Promise<void> {
  requireAdminOrThrow(await isAdmin());
  const id = String(formData.get("id") ?? "");
  const roster = await getRoster();
  const next = roster.map((p) => (p.id === id ? { ...p, active: !p.active } : p));
  await saveRoster(next);
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function updatePlayerAction(formData: FormData): Promise<void> {
  requireAdminOrThrow(await isAdmin());
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const udiscHandle = String(formData.get("udiscHandle") ?? "").trim();
  const roster = await getRoster();
  const next = roster.map((p) =>
    p.id === id ? { ...p, name: name || p.name, udiscHandle: udiscHandle || undefined } : p
  );
  await saveRoster(next);
  revalidatePath("/admin");
}

export async function updateSeasonAction(formData: FormData): Promise<void> {
  requireAdminOrThrow(await isAdmin());
  const year = Number(formData.get("currentSeason") ?? 0);
  if (!year || year < 2000 || year > 2100) return;
  await saveSettings({ currentSeason: year });
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function previewUdiscAction(formData: FormData): Promise<void> {
  requireAdminOrThrow(await isAdmin());
  const url = String(formData.get("udiscUrl") ?? "").trim();
  redirect(`/admin/rounds/new?${new URLSearchParams({ udiscUrl: url }).toString()}`);
}

export async function submitRoundAction(formData: FormData): Promise<void> {
  requireAdminOrThrow(await isAdmin());
  const date = String(formData.get("date") ?? "").trim();
  const source = (String(formData.get("source") ?? "manual") as "udisc" | "manual");
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
  await addRound(round);
  revalidatePath("/");
  revalidatePath("/rounds");
  redirect(`/rounds/${id}`);
}

export async function deleteRoundAction(formData: FormData): Promise<void> {
  requireAdminOrThrow(await isAdmin());
  const id = String(formData.get("id") ?? "");
  await deleteRound(id);
  revalidatePath("/");
  revalidatePath("/rounds");
  redirect("/rounds");
}

function uniqueId(base: string, taken: string[]): string {
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
