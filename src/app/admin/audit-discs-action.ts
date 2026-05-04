"use server";

import { getUser } from "@/lib/auth";
import { supabaseSession, supabaseAdmin } from "@/lib/supabase/server";
import { auditBagDiscs, auditSummary } from "@/lib/disc-audit";
import { getRoster } from "@/lib/store";
import type { DiscRecord } from "@/lib/discs-db";

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
    const mismatches = auditBagDiscs(bagDiscs || []);
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
    const mismatches = auditBagDiscs(bagDiscs || []);
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

export async function addDiscToDatabase(disc: DiscRecord) {
  try {
    const user = await getUser();
    if (!user) throw new Error("Not authenticated");

    if (!disc.manufacturer || !disc.name) {
      throw new Error("Manufacturer and name are required");
    }

    const fs = require("fs") as typeof import("fs");
    const path = require("path") as typeof import("path");

    const dbPath = path.join(process.cwd(), "src/lib/discs-db.ts");
    console.log("addDiscToDatabase: dbPath =", dbPath);

    if (!fs.existsSync(dbPath)) {
      throw new Error(`Database file not found at ${dbPath}`);
    }

    let content = fs.readFileSync(dbPath, "utf-8");
    console.log("addDiscToDatabase: Read file, size =", content.length);

    // Check if disc already exists
    const escapedMfg = disc.manufacturer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const escapedName = disc.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existsPattern = new RegExp(
      `manufacturer:\\s*"${escapedMfg}"\\s*,\\s*name:\\s*"${escapedName}"`
    );

    console.log("addDiscToDatabase: Checking if disc exists:", escapedMfg, escapedName);
    if (existsPattern.test(content)) {
      throw new Error(`Disc already exists: ${disc.manufacturer} ${disc.name}`);
    }

    // Create the new disc entry
    const newDisc = `  { manufacturer: "${disc.manufacturer.replace(/"/g, '\\"')}", name: "${disc.name.replace(/"/g, '\\"')}", type: "${disc.type}", speed: ${disc.speed}, glide: ${disc.glide}, turn: ${disc.turn}, fade: ${disc.fade} },\n`;
    console.log("addDiscToDatabase: New disc entry:", newDisc);

    // Find the DISC_DB closing ]; by looking for the pattern (last disc object followed by ]);
    const discDbEndPattern = /(\},\s*)\];/m;
    if (!discDbEndPattern.test(content)) {
      console.log("addDiscToDatabase: File content around last lines:", content.slice(-200));
      throw new Error("Database file format invalid - cannot find DISC_DB closing ];");
    }

    const beforeReplace = content.length;
    content = content.replace(discDbEndPattern, `$1\n${newDisc}];`);
    const afterReplace = content.length;
    console.log("addDiscToDatabase: File size before:", beforeReplace, "after:", afterReplace);

    fs.writeFileSync(dbPath, content, "utf-8");

    console.log(`Added disc: ${disc.manufacturer} ${disc.name}`);
    return { success: true, message: `Added ${disc.name}` };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("addDiscToDatabase error:", message);
    throw new Error(message);
  }
}

export async function fixBagDiscsUserIds() {
  try {
    console.log("fixBagDiscsUserIds: Starting");
    const user = await getUser();
    if (!user) throw new Error("Not authenticated");

    const supabase = supabaseAdmin();

    // Mapping 1: jeffrey-rijkse
    console.log("fixBagDiscsUserIds: Applying jeffrey-rijkse mapping");
    const { error: err1 } = await supabase
      .from("bag_discs")
      .update({ user_id: "jeffrey-rijkse" })
      .eq("user_id", "e33d8a43-3646-40ec-a92d-d1ff654c155d");
    if (err1) throw new Error(`Failed to update jeffrey-rijkse: ${err1.message}`);

    // Mapping 2: mathieu-jacob
    console.log("fixBagDiscsUserIds: Applying mathieu-jacob mapping");
    const { error: err2 } = await supabase
      .from("bag_discs")
      .update({ user_id: "mathieu-jacob" })
      .eq("user_id", "c60544c5-faad-4605-9164-0d122ab0dce2");
    if (err2) throw new Error(`Failed to update mathieu-jacob: ${err2.message}`);

    // Mapping 3: reginald-roth
    console.log("fixBagDiscsUserIds: Applying reginald-roth mapping");
    const { error: err3 } = await supabase
      .from("bag_discs")
      .update({ user_id: "reginald-roth" })
      .eq("user_id", "62e39edd-90a7-45ef-b99c-801909f576fa");
    if (err3) throw new Error(`Failed to update reginald-roth: ${err3.message}`);

    // Mapping 4: john-cormier
    console.log("fixBagDiscsUserIds: Applying john-cormier mapping");
    const { error: err4 } = await supabase
      .from("bag_discs")
      .update({ user_id: "john-cormier" })
      .eq("user_id", "9a3d2575-283b-45d8-a755-2c0e46e7180b");
    if (err4) throw new Error(`Failed to update john-cormier: ${err4.message}`);

    // Check for remaining invalid UUIDs
    console.log("fixBagDiscsUserIds: Checking for remaining invalid user_ids");
    const { data: allBagDiscs, error: fetchErr } = await supabase
      .from("bag_discs")
      .select("user_id");
    if (fetchErr) throw new Error(`Failed to fetch bag_discs: ${fetchErr.message}`);

    const { data: players, error: playerErr } = await supabase
      .from("players")
      .select("id");
    if (playerErr) throw new Error(`Failed to fetch players: ${playerErr.message}`);

    const validIds = new Set(players.map(p => p.id));
    const uniqueUserIds = [...new Set(allBagDiscs.map(d => d.user_id))];
    const remainingInvalid = uniqueUserIds.filter(id => !validIds.has(id));

    console.log("fixBagDiscsUserIds: Complete");
    console.log("fixBagDiscsUserIds: Remaining invalid UUIDs:", remainingInvalid);

    return {
      success: true,
      message: "Fixed 4 user_id mappings",
      remainingInvalidIds: remainingInvalid,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("fixBagDiscsUserIds error:", message);
    throw new Error(message);
  }
}
