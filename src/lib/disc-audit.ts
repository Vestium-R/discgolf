import { DISC_DB, type DiscRecord } from "./discs-db";

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
  mismatchType: "not_found" | "speed" | "glide" | "turn" | "fade";
  expected?: { speed?: number; glide?: number; turn?: number; fade?: number };
};

export function auditBagDiscs(bagDiscs: BagDisc[]): DiscMismatch[] {
  const mismatches: DiscMismatch[] = [];

  for (const bagDisc of bagDiscs) {
    // Find matching disc in DB by name and manufacturer
    let dbDisc = DISC_DB.find(
      (d) =>
        d.name.toLowerCase() === bagDisc.disc_name.toLowerCase() &&
        d.manufacturer.toLowerCase() === (bagDisc.manufacturer || "").toLowerCase()
    );

    // If not found by exact match, try by name alone (in case manufacturer is wrong)
    if (!dbDisc) {
      dbDisc = DISC_DB.find(
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

    // Check each flight number
    if (bagDisc.speed !== dbDisc.speed) {
      mismatches.push({
        bagDisc,
        dbDisc,
        mismatchType: "speed",
        expected: { speed: dbDisc.speed },
      });
    }
    if (bagDisc.glide !== null && bagDisc.glide !== dbDisc.glide) {
      mismatches.push({
        bagDisc,
        dbDisc,
        mismatchType: "glide",
        expected: { glide: dbDisc.glide },
      });
    }
    if (bagDisc.turn !== null && bagDisc.turn !== dbDisc.turn) {
      mismatches.push({
        bagDisc,
        dbDisc,
        mismatchType: "turn",
        expected: { turn: dbDisc.turn },
      });
    }
    if (bagDisc.fade !== null && bagDisc.fade !== dbDisc.fade) {
      mismatches.push({
        bagDisc,
        dbDisc,
        mismatchType: "fade",
        expected: { fade: dbDisc.fade },
      });
    }
  }

  return mismatches;
}

export function auditSummary(mismatches: DiscMismatch[]) {
  const notFound = mismatches.filter((m) => m.mismatchType === "not_found").length;
  const hasFlightMismatches = mismatches.length - notFound;

  return {
    totalMismatches: mismatches.length,
    notFound,
    flightNumberMismatches: hasFlightMismatches,
    byType: {
      speed: mismatches.filter((m) => m.mismatchType === "speed").length,
      glide: mismatches.filter((m) => m.mismatchType === "glide").length,
      turn: mismatches.filter((m) => m.mismatchType === "turn").length,
      fade: mismatches.filter((m) => m.mismatchType === "fade").length,
    },
  };
}
