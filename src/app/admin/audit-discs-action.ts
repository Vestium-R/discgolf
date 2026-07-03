"use server";

import { getUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { auditBagDiscs, auditSummary } from "@/lib/disc-audit";
import { getRoster } from "@/lib/store";
import { DISC_DB, type DiscRecord } from "@/lib/discs-db";

const discDb = DISC_DB as unknown as DiscRecord[];

export async function getRosterForAudit() {
  try {
    console.log("getRosterForAudit: Starting");
    const user = await getUser();
    console.log("getRosterForAudit: User =", user?.email);
    if (!user) throw new Error("Not authenticated");

    console.log("getRosterForAudit: Calling getRoster");
    const roster = await getRoster();
    console.log("getRosterForAudit: Got roster with", roster?.length, "players");
    return roster || [];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("getRosterForAudit error:", message);
    console.error("getRosterForAudit error details:", error);
    // Return empty array instead of throwing to prevent the entire component from failing
    return [];
  }
}

export async function auditUserBagDiscs(userId?: string) {
  try {
    console.log("auditUserBagDiscs: Starting, userId =", userId);
    const user = await getUser();
    console.log("auditUserBagDiscs: User =", user?.email);
    if (!user) throw new Error("Not authenticated");

    const targetUserId = userId || user.id;
    if (!targetUserId) throw new Error("No user ID available");

    console.log("auditUserBagDiscs: Fetching bag discs for user", targetUserId);
    const supabase = supabaseAdmin();
    const { data: bagDiscs, error } = await supabase
      .from("bag_discs")
      .select("*")
      .eq("user_id", targetUserId);

    if (error) throw new Error(`Failed to fetch bag discs: ${error.message}`);

    console.log("auditUserBagDiscs: Got", bagDiscs?.length, "discs");
    const mismatches = auditBagDiscs(bagDiscs || [], discDb);
    const summary = auditSummary(mismatches);

    return {
      userId: targetUserId,
      totalBagDiscs: bagDiscs?.length || 0,
      mismatches,
      summary,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("auditUserBagDiscs error:", message);
    console.error("auditUserBagDiscs error details:", error);
    throw new Error(`Audit failed: ${message}`);
  }
}

export async function auditAllBagDiscs() {
  try {
    console.log("auditAllBagDiscs: Starting");
    const user = await getUser();
    console.log("auditAllBagDiscs: User =", user?.email);
    if (!user) throw new Error("Not authenticated");

    console.log("auditAllBagDiscs: Fetching all bag discs");
    const supabase = supabaseAdmin();
    const { data: bagDiscs, error } = await supabase.from("bag_discs").select("*");

    if (error) throw new Error(`Failed to fetch bag discs: ${error.message}`);

    console.log("auditAllBagDiscs: Got", bagDiscs?.length, "discs");
    const mismatches = auditBagDiscs(bagDiscs || [], discDb);
    const summary = auditSummary(mismatches);

    return {
      userId: "all",
      totalBagDiscs: bagDiscs?.length || 0,
      mismatches,
      summary,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("auditAllBagDiscs error:", message);
    console.error("auditAllBagDiscs error details:", error);
    throw new Error(`Audit failed: ${message}`);
  }
}

export async function fixBagDiscFlightNumbers(bagDiscId: string, dbDisc: DiscRecord) {
  try {
    console.log("fixBagDiscFlightNumbers: Fixing", bagDiscId);
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

    if (error) throw new Error(`Supabase error: ${error.message}`);
    console.log("fixBagDiscFlightNumbers: Fixed", dbDisc.name);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("fixBagDiscFlightNumbers error:", message);
    throw new Error(message);
  }
}

export async function updateDiscInDatabase(disc: DiscRecord) {
  try {
    const user = await getUser();
    if (!user) throw new Error("Not authenticated");

    const fs = require("fs") as typeof import("fs");
    const path = require("path") as typeof import("path");

    const dbPath = path.join(process.cwd(), "src/lib/discs-db.ts");
    console.log("updateDiscInDatabase: dbPath =", dbPath);

    if (!fs.existsSync(dbPath)) {
      throw new Error(`Database file not found at ${dbPath}`);
    }

    let content = fs.readFileSync(dbPath, "utf-8");
    console.log("updateDiscInDatabase: Read file, size =", content.length);

    // Find the disc entry to replace
    const escapedMfg = disc.manufacturer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedName = disc.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `\\{\\s*manufacturer:\\s*"${escapedMfg}"\\s*,\\s*name:\\s*"${escapedName}"\\s*,\\s*type:\\s*"${disc.type}"\\s*,\\s*speed:\\s*[\\d.-]+\\s*,\\s*glide:\\s*[\\d.-]+\\s*,\\s*turn:\\s*[\\d.-]+\\s*,\\s*fade:\\s*[\\d.-]+\\s*\\}`,
      "g"
    );

    const replacement = `{ manufacturer: "${disc.manufacturer.replace(/"/g, '\\"')}", name: "${disc.name.replace(/"/g, '\\"')}", type: "${disc.type}", speed: ${disc.speed}, glide: ${disc.glide}, turn: ${disc.turn}, fade: ${disc.fade} }`;

    if (!pattern.test(content)) {
      throw new Error(`Disc not found in database: ${disc.manufacturer} ${disc.name}`);
    }

    content = content.replace(pattern, replacement);
    fs.writeFileSync(dbPath, content, "utf-8");

    console.log(`Updated disc: ${disc.manufacturer} ${disc.name}`);
    return { success: true, message: `Updated ${disc.name}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("updateDiscInDatabase error:", message);
    throw new Error(message);
  }
}


export async function fixBagDiscsUserIds() {
  try {
    console.log("fixBagDiscsUserIds: Starting");
    const user = await getUser();
    if (!user) throw new Error("Not authenticated");

    const supabase = supabaseAdmin();

    // bag_discs.user_id references auth.users.id (always UUID)
    // This audit checks that all user_ids in bag_discs are valid auth.users UUIDs
    console.log("fixBagDiscsUserIds: Auditing bag_discs.user_id values");

    const { data: allBagDiscs, error: fetchErr } = await supabase
      .from("bag_discs")
      .select("user_id");
    if (fetchErr) throw new Error(`Failed to fetch bag_discs: ${fetchErr.message}`);

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const uniqueUserIds = [...new Set(allBagDiscs.map(d => d.user_id))];
    const validUUIDs = uniqueUserIds.filter(id => uuidRegex.test(id));
    const invalidIds = uniqueUserIds.filter(id => !uuidRegex.test(id));

    console.log("fixBagDiscsUserIds: Complete");
    console.log("fixBagDiscsUserIds: Total unique user_ids:", uniqueUserIds.length);
    console.log("fixBagDiscsUserIds: Valid UUID format:", validUUIDs.length);
    console.log("fixBagDiscsUserIds: Invalid format:", invalidIds.length);

    if (invalidIds.length > 0) {
      console.warn("fixBagDiscsUserIds: WARNING - Found invalid user_ids:", invalidIds);
    }

    return {
      success: true,
      message: `Audit complete: ${validUUIDs.length}/${uniqueUserIds.length} valid UUIDs`,
      validUUIDs,
      invalidIds,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("fixBagDiscsUserIds error:", message);
    throw new Error(message);
  }
}
