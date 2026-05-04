"use server";

import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { auditBagDiscs, auditSummary } from "@/lib/disc-audit";
import type { DiscRecord } from "@/lib/discs-db";

export async function auditUserBagDiscs(userId?: string) {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");

  const targetUserId = userId || user.id;

  const supabase = await createClient();
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
  // Admin check should go here

  const supabase = await createClient();
  const { data: bagDiscs, error } = await supabase.from("bag_discs").select("*");

  if (error) throw error;

  const mismatches = auditBagDiscs(bagDiscs || []);
  const summary = auditSummary(mismatches);

  return {
    totalBagsDiscs: bagDiscs?.length || 0,
    mismatches,
    summary,
  };
}

export async function fixBagDiscFlightNumbers(bagDiscId: string, dbDisc: DiscRecord) {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");

  const supabase = await createClient();
  const { error } = await supabase
    .from("bag_discs")
    .update({
      speed: dbDisc.speed,
      glide: dbDisc.glide,
      turn: dbDisc.turn,
      fade: dbDisc.fade,
    })
    .eq("id", bagDiscId);

  if (error) throw error;
}
