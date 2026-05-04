"use server";

import { getUser } from "@/lib/auth";
import { supabaseSession, supabaseAdmin } from "@/lib/supabase/server";
import { auditBagDiscs, auditSummary } from "@/lib/disc-audit";
import { getRoster } from "@/lib/store";
import type { DiscRecord } from "@/lib/discs-db";

export async function getRosterForAudit() {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");

  return await getRoster();
}

export async function auditUserBagDiscs(userId?: string) {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");

  const targetUserId = userId || user.id;

  const supabase = await supabaseSession();
  const { data: bagDiscs, error } = await supabase
    .from("bag_discs")
    .select("*")
    .eq("user_id", targetUserId);

  if (error) throw error;

  const mismatches = auditBagDiscs(bagDiscs || []);
  const summary = auditSummary(mismatches);

  return {
    userId: targetUserId,
    totalBagDiscs: bagDiscs?.length || 0,
    mismatches,
    summary,
  };
}

export async function auditAllBagDiscs() {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");

  const supabase = supabaseAdmin();
  const { data: bagDiscs, error } = await supabase.from("bag_discs").select("*");

  if (error) throw error;

  const mismatches = auditBagDiscs(bagDiscs || []);
  const summary = auditSummary(mismatches);

  return {
    userId: "all",
    totalBagDiscs: bagDiscs?.length || 0,
    mismatches,
    summary,
  };
}

export async function fixBagDiscFlightNumbers(bagDiscId: string, dbDisc: DiscRecord) {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");

  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("bag_discs")
    .update({
      disc_name: dbDisc.name,
      manufacturer: dbDisc.manufacturer,
      speed: dbDisc.speed,
      glide: dbDisc.glide,
      turn: dbDisc.turn,
      fade: dbDisc.fade,
    })
    .eq("id", bagDiscId);

  if (error) throw error;
}

export async function updateDiscInDatabase(disc: DiscRecord) {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");

  const fs = await import("fs");
  const path = await import("path");

  const dbPath = path.join(process.cwd(), "src/lib/discs-db.ts");
  let content = fs.readFileSync(dbPath, "utf-8");

  // Find the disc entry to replace
  const pattern = new RegExp(
    `\\{\\s*manufacturer:\\s*"${disc.manufacturer.replace(/[.*+?^${}()|\\[\\]\\\\]/g, "\\$&")}"\\s*,\\s*name:\\s*"${disc.name.replace(/[.*+?^${}()|\\[\\]\\\\]/g, "\\$&")}"\\s*,\\s*type:\\s*"${disc.type}"\\s*,\\s*speed:\\s*[\\d.-]+\\s*,\\s*glide:\\s*[\\d.-]+\\s*,\\s*turn:\\s*[\\d.-]+\\s*,\\s*fade:\\s*[\\d.-]+\\s*\\}`,
    "g"
  );

  const replacement = `{ manufacturer: "${disc.manufacturer}", name: "${disc.name}", type: "${disc.type}", speed: ${disc.speed}, glide: ${disc.glide}, turn: ${disc.turn}, fade: ${disc.fade} }`;

  if (!pattern.test(content)) {
    throw new Error(`Disc not found: ${disc.manufacturer} ${disc.name}`);
  }

  content = content.replace(pattern, replacement);
  fs.writeFileSync(dbPath, content, "utf-8");
}

export async function addDiscToDatabase(disc: DiscRecord) {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");

  const fs = await import("fs");
  const path = await import("path");

  const dbPath = path.join(process.cwd(), "src/lib/discs-db.ts");
  let content = fs.readFileSync(dbPath, "utf-8");

  // Check if disc already exists
  const existsPattern = new RegExp(
    `manufacturer:\\s*"${disc.manufacturer.replace(/[.*+?^${}()|\\[\\]\\\\]/g, "\\$&")}"\\s*,\\s*name:\\s*"${disc.name.replace(/[.*+?^${}()|\\[\\]\\\\]/g, "\\$&")}"`
  );

  if (existsPattern.test(content)) {
    throw new Error(`Disc already exists: ${disc.manufacturer} ${disc.name}`);
  }

  // Find the last closing bracket and insert before it
  const newDisc = `  { manufacturer: "${disc.manufacturer}", name: "${disc.name}", type: "${disc.type}", speed: ${disc.speed}, glide: ${disc.glide}, turn: ${disc.turn}, fade: ${disc.fade} },\n`;

  // Insert before the final ];
  content = content.replace(/\n\];$/, `\n${newDisc}];`);

  fs.writeFileSync(dbPath, content, "utf-8");
}
