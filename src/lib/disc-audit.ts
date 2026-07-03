import type { DiscRecord } from "./discs-db";

export type BagDisc = {
  id: string;
  user_id: string;
  disc_name: string;
  manufacturer: string | null;
  type: string;
  speed: number;
  glide: number | null;
  turn: number | null;
  fade: number | null;
  plastic: string | null;
  notes: string | null;
};

export type DiscMismatch = {
  bagDisc: BagDisc;
  dbDisc: DiscRecord | null;
  mismatchType: "not_found" | "manufacturer" | "speed" | "glide" | "turn" | "fade";
  expected?: { speed?: number; glide?: number; turn?: number; fade?: number; manufacturer?: string };
};

export function auditBagDiscs(bagDiscs: BagDisc[], discDb: DiscRecord[]): DiscMismatch[] {
  const mismatches: DiscMismatch[] = [];

  for (const bagDisc of bagDiscs) {
    // Find matching disc in DB by name and manufacturer
    let dbDisc = discDb.find(
      (d) =>
        d.name.toLowerCase() === bagDisc.disc_name.toLowerCase() &&
        d.manufacturer.toLowerCase() === (bagDisc.manufacturer || "").toLowerCase()
    );

    // If not found by exact match, try by name alone (in case manufacturer is wrong)
    if (!dbDisc) {
      dbDisc = discDb.find(
        (d) => d.name.toLowerCase() === bagDisc.disc_name.toLowerCase()
      );
    }

    if (!dbDisc) {
      mismatches.push({
        bagDisc,
        dbDisc: null,
        mismatchType: "not_found",
      });
      continue;
    }

    // Check manufacturer mismatch
    if (bagDisc.manufacturer?.toLowerCase() !== dbDisc.manufacturer.toLowerCase()) {
      mismatches.push({
        bagDisc,
        dbDisc: dbDisc as DiscRecord,
        mismatchType: "manufacturer",
        expected: { manufacturer: dbDisc.manufacturer },
      });
    }

    // Check each flight number
    if (bagDisc.speed !== dbDisc.speed) {
      mismatches.push({
        bagDisc,
        dbDisc: dbDisc as DiscRecord,
        mismatchType: "speed",
        expected: { speed: dbDisc.speed },
      });
    }
    if (bagDisc.glide !== null && bagDisc.glide !== dbDisc.glide) {
      mismatches.push({
        bagDisc,
        dbDisc: dbDisc as DiscRecord,
        mismatchType: "glide",
        expected: { glide: dbDisc.glide },
      });
    }
    if (bagDisc.turn !== null && bagDisc.turn !== dbDisc.turn) {
      mismatches.push({
        bagDisc,
        dbDisc: dbDisc as DiscRecord,
        mismatchType: "turn",
        expected: { turn: dbDisc.turn },
      });
    }
    if (bagDisc.fade !== null && bagDisc.fade !== dbDisc.fade) {
      mismatches.push({
        bagDisc,
        dbDisc: dbDisc as DiscRecord,
        mismatchType: "fade",
        expected: { fade: dbDisc.fade },
      });
    }
  }

  return mismatches;
}

export function auditSummary(mismatches: DiscMismatch[]) {
  const notFound = mismatches.filter((m) => m.mismatchType === "not_found").length;
  const manufacturerMismatches = mismatches.filter((m) => m.mismatchType === "manufacturer").length;
  const flightMismatches = mismatches.filter((m) => ["speed", "glide", "turn", "fade"].includes(m.mismatchType)).length;

  return {
    totalMismatches: mismatches.length,
    notFound,
    manufacturerMismatches,
    flightNumberMismatches: flightMismatches,
    byType: {
      manufacturer: manufacturerMismatches,
      speed: mismatches.filter((m) => m.mismatchType === "speed").length,
      glide: mismatches.filter((m) => m.mismatchType === "glide").length,
      turn: mismatches.filter((m) => m.mismatchType === "turn").length,
      fade: mismatches.filter((m) => m.mismatchType === "fade").length,
    },
  };
}
