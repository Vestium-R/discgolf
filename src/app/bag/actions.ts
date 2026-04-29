"use server";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";
import { addBagDisc, removeBagDisc, saveUserPrefs, toggleBagStorage, updateBagDisc } from "@/lib/store";
import type { DiscType } from "@/lib/types";

export async function addDiscAction(formData: FormData): Promise<void> {
  const user = await getUser();
  if (!user) return;

  const discName = String(formData.get("discName") ?? "").trim();
  const manufacturer = String(formData.get("manufacturer") ?? "").trim() || undefined;
  const type = String(formData.get("type") ?? "") as DiscType;
  const speed = Number(formData.get("speed"));
  const glide = formData.get("glide") ? Number(formData.get("glide")) : undefined;
  const turnRaw = formData.get("turn");
  const turn = turnRaw !== null && turnRaw !== "" ? Number(turnRaw) : undefined;
  const fade = formData.get("fade") ? Number(formData.get("fade")) : undefined;
  const plastic = String(formData.get("plastic") ?? "").trim() || undefined;
  const color = String(formData.get("color") ?? "").trim() || undefined;
  const weightRaw = formData.get("weight");
  const weightG = weightRaw && weightRaw !== "" ? Number(weightRaw) : undefined;
  const notes = String(formData.get("notes") ?? "").trim() || undefined;

  if (!discName || !type || !Number.isFinite(speed)) return;

  await addBagDisc(user.id, { discName, manufacturer, type, speed, glide, turn, fade, plastic, color, weightG, notes });
  revalidatePath("/bag");
}

export async function removeDiscAction(formData: FormData): Promise<void> {
  const user = await getUser();
  if (!user) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await removeBagDisc(id, user.id);
  revalidatePath("/bag");
}

export async function saveUserPrefsAction(prefs: { maxDistFt: number; throwStyle: string; playStyle: string; yearsPlaying?: number }): Promise<void> {
  const user = await getUser();
  if (!user) return;
  await saveUserPrefs(user.id, prefs);
}

export async function toggleStorageAction(formData: FormData): Promise<void> {
  const user = await getUser();
  if (!user) return;
  const id = String(formData.get("id") ?? "");
  const inStorage = formData.get("inStorage") === "1";
  if (!id) return;
  await toggleBagStorage(id, user.id, inStorage);
  revalidatePath("/bag");
}

export async function updateDiscAction(formData: FormData): Promise<void> {
  const user = await getUser();
  if (!user) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const discName = String(formData.get("discName") ?? "").trim();
  const manufacturer = String(formData.get("manufacturer") ?? "").trim() || undefined;
  const type = String(formData.get("type") ?? "") as DiscType;
  const speed = Number(formData.get("speed"));
  const glide = formData.get("glide") ? Number(formData.get("glide")) : undefined;
  const turnRaw = formData.get("turn");
  const turn = turnRaw !== null && turnRaw !== "" ? Number(turnRaw) : undefined;
  const fade = formData.get("fade") ? Number(formData.get("fade")) : undefined;
  const plastic = String(formData.get("plastic") ?? "").trim() || undefined;
  const color = String(formData.get("color") ?? "").trim() || undefined;
  const weightRaw = formData.get("weight");
  const weightG = weightRaw && weightRaw !== "" ? Number(weightRaw) : undefined;
  const notes = String(formData.get("notes") ?? "").trim() || undefined;

  if (!discName || !type || !Number.isFinite(speed)) return;
  await updateBagDisc(id, user.id, { discName, manufacturer, type, speed, glide, turn, fade, plastic, color, weightG, notes });
  revalidatePath("/bag");
}
