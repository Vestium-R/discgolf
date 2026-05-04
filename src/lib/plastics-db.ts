/**
 * Disc golf plastic database — sourced from flightcharts.dgputtheads.com/discgolfplastics.html
 * stabilityOffset: how this plastic affects flight vs baseline numbers
 *   +1 = more overstable than printed, 0 = true to numbers, -1 = more understable
 * durability: 1 (wears fast) → 5 (very durable)
 * breakIn: "fast" | "medium" | "slow"
 * firmness: "soft" | "flexible" | "medium" | "firm" | "hard"
 */

export type PlasticRecord = {
  manufacturer: string;
  name: string;
  stabilityOffset: number;   // -1 to +1
  durability: number;        // 1-5
  breakIn: "fast" | "medium" | "slow";
  firmness: "soft" | "flexible" | "medium" | "firm" | "hard";
};

export const PLASTICS: PlasticRecord[] = [
  // ── Innova ──────────────────────────────────────────────────────────────────
  { manufacturer:"Innova", name:"Champion",          stabilityOffset: 0.5,  durability:5, breakIn:"slow",   firmness:"firm"     },
  { manufacturer:"Innova", name:"Champion Glow",     stabilityOffset: 0.5,  durability:5, breakIn:"slow",   firmness:"firm"     },
  { manufacturer:"Innova", name:"Star",              stabilityOffset: 0.3,  durability:4, breakIn:"slow",   firmness:"medium"   },
  { manufacturer:"Innova", name:"Shimmer Star",      stabilityOffset: 0.5,  durability:5, breakIn:"slow",   firmness:"firm"     },
  { manufacturer:"Innova", name:"Gstar",             stabilityOffset: 0,    durability:4, breakIn:"slow",   firmness:"flexible" },
  { manufacturer:"Innova", name:"StarLite",          stabilityOffset:-0.3,  durability:4, breakIn:"medium", firmness:"medium"   },
  { manufacturer:"Innova", name:"Blizzard Champion", stabilityOffset:-0.3,  durability:4, breakIn:"medium", firmness:"medium"   },
  { manufacturer:"Innova", name:"XT",                stabilityOffset:-0.3,  durability:4, breakIn:"slow",   firmness:"flexible" },
  { manufacturer:"Innova", name:"Pro",               stabilityOffset:-0.5,  durability:3, breakIn:"fast",   firmness:"medium"   },
  { manufacturer:"Innova", name:"KC Pro",            stabilityOffset:-0.5,  durability:3, breakIn:"medium", firmness:"hard"     },
  { manufacturer:"Innova", name:"R-Pro",             stabilityOffset:-0.3,  durability:3, breakIn:"medium", firmness:"flexible" },
  { manufacturer:"Innova", name:"JK Pro",            stabilityOffset:-0.3,  durability:4, breakIn:"slow",   firmness:"flexible" },
  { manufacturer:"Innova", name:"DX",                stabilityOffset: 0,    durability:1, breakIn:"fast",   firmness:"soft"     },
  { manufacturer:"Innova", name:"EchoStar",          stabilityOffset:-0.5,  durability:3, breakIn:"fast",   firmness:"medium"   },

  // ── Discraft ─────────────────────────────────────────────────────────────────
  { manufacturer:"Discraft", name:"Titanium",        stabilityOffset: 0.5,  durability:5, breakIn:"slow",   firmness:"firm"     },
  { manufacturer:"Discraft", name:"ESP",             stabilityOffset: 0.3,  durability:4, breakIn:"slow",   firmness:"medium"   },
  { manufacturer:"Discraft", name:"ESP FLX",         stabilityOffset:-0.3,  durability:4, breakIn:"medium", firmness:"medium"   },
  { manufacturer:"Discraft", name:"Elite Z",         stabilityOffset: 0.5,  durability:5, breakIn:"slow",   firmness:"firm"     },
  { manufacturer:"Discraft", name:"Z FLX",           stabilityOffset: 0,    durability:4, breakIn:"slow",   firmness:"flexible" },
  { manufacturer:"Discraft", name:"Z Lite",          stabilityOffset: 0,    durability:4, breakIn:"slow",   firmness:"flexible" },
  { manufacturer:"Discraft", name:"Big Z",           stabilityOffset: 0.3,  durability:4, breakIn:"slow",   firmness:"medium"   },
  { manufacturer:"Discraft", name:"Jawbreaker",      stabilityOffset:-0.3,  durability:4, breakIn:"slow",   firmness:"flexible" },
  { manufacturer:"Discraft", name:"X",               stabilityOffset:-0.5,  durability:3, breakIn:"fast",   firmness:"medium"   },
  { manufacturer:"Discraft", name:"Pro D",           stabilityOffset:-0.3,  durability:4, breakIn:"slow",   firmness:"flexible" },
  { manufacturer:"Discraft", name:"Pro-D",          stabilityOffset:-0.3,  durability:4, breakIn:"slow",   firmness:"flexible" },
  { manufacturer:"Discraft", name:"Z",               stabilityOffset: 0.5,  durability:5, breakIn:"slow",   firmness:"firm"     },
  { manufacturer:"Discraft", name:"Putter Line",     stabilityOffset: 0,    durability:3, breakIn:"medium", firmness:"medium"   },
  { manufacturer:"Discraft", name:"Biofuzion",       stabilityOffset: 0.3,  durability:4, breakIn:"slow",   firmness:"firm"     },

  // ── Dynamic Discs / Latitude 64 / Westside ───────────────────────────────────
  { manufacturer:"Dynamic Discs", name:"Lucid",      stabilityOffset:-0.3,  durability:4, breakIn:"medium", firmness:"medium"   },
  { manufacturer:"Dynamic Discs", name:"Fuzion",     stabilityOffset: 0,    durability:4, breakIn:"slow",   firmness:"flexible" },
  { manufacturer:"Dynamic Discs", name:"Lucid Air",  stabilityOffset: 0.5,  durability:4, breakIn:"slow",   firmness:"firm"     },
  { manufacturer:"Dynamic Discs", name:"Classic",    stabilityOffset:-0.3,  durability:4, breakIn:"slow",   firmness:"flexible" },
  { manufacturer:"Dynamic Discs", name:"Classic Soft",stabilityOffset: 0,   durability:1, breakIn:"fast",   firmness:"soft"     },
  { manufacturer:"Dynamic Discs", name:"Prime",      stabilityOffset:-0.3,  durability:4, breakIn:"slow",   firmness:"flexible" },
  { manufacturer:"Dynamic Discs", name:"BioFuzion",  stabilityOffset: 0.3,  durability:4, breakIn:"slow",   firmness:"firm"     },
  { manufacturer:"Latitude 64",   name:"Opto",       stabilityOffset:-0.3,  durability:4, breakIn:"medium", firmness:"medium"   },
  { manufacturer:"Latitude 64",   name:"Opto Air",   stabilityOffset: 0.5,  durability:4, breakIn:"slow",   firmness:"firm"     },
  { manufacturer:"Latitude 64",   name:"Gold Line",  stabilityOffset: 0,    durability:4, breakIn:"slow",   firmness:"flexible" },
  { manufacturer:"Latitude 64",   name:"Retro",      stabilityOffset: 0,    durability:4, breakIn:"slow",   firmness:"medium"   },
  { manufacturer:"Latitude 64",   name:"Zero Soft",  stabilityOffset:-0.5,  durability:3, breakIn:"fast",   firmness:"soft"     },
  { manufacturer:"Latitude 64",   name:"Zero Hard",  stabilityOffset:-0.5,  durability:4, breakIn:"medium", firmness:"flexible" },
  { manufacturer:"Westside Discs",name:"VIP",        stabilityOffset:-0.3,  durability:4, breakIn:"medium", firmness:"medium"   },
  { manufacturer:"Westside Discs",name:"VIP Air",    stabilityOffset: 0.5,  durability:4, breakIn:"slow",   firmness:"firm"     },
  { manufacturer:"Westside Discs",name:"Tournament", stabilityOffset: 0,    durability:4, breakIn:"slow",   firmness:"flexible" },
  { manufacturer:"Westside Discs",name:"BT Soft",    stabilityOffset:-0.5,  durability:3, breakIn:"fast",   firmness:"soft"     },
  { manufacturer:"Westside Discs",name:"BT Medium",  stabilityOffset:-0.3,  durability:4, breakIn:"slow",   firmness:"flexible" },
  { manufacturer:"Westside Discs",name:"BT Hard",    stabilityOffset:-0.5,  durability:4, breakIn:"medium", firmness:"flexible" },

  // ── MVP / Axiom / Streamline ─────────────────────────────────────────────────
  { manufacturer:"MVP",     name:"Neutron",          stabilityOffset: 0.3,  durability:4, breakIn:"slow",   firmness:"medium"   },
  { manufacturer:"MVP",     name:"Plasma",           stabilityOffset: 0.5,  durability:4, breakIn:"slow",   firmness:"firm"     },
  { manufacturer:"MVP",     name:"Proton",           stabilityOffset: 0,    durability:4, breakIn:"slow",   firmness:"flexible" },
  { manufacturer:"MVP",     name:"Fission",          stabilityOffset:-0.3,  durability:4, breakIn:"medium", firmness:"medium"   },
  { manufacturer:"MVP",     name:"R2 Neutron",       stabilityOffset:-0.3,  durability:4, breakIn:"medium", firmness:"medium"   },
  { manufacturer:"MVP",     name:"Electron",         stabilityOffset:-0.5,  durability:3, breakIn:"fast",   firmness:"medium"   },
  { manufacturer:"MVP",     name:"Electron Soft",    stabilityOffset: 0,    durability:1, breakIn:"fast",   firmness:"soft"     },
  { manufacturer:"MVP",     name:"Electron Firm",    stabilityOffset:-0.3,  durability:4, breakIn:"slow",   firmness:"flexible" },
  { manufacturer:"Axiom",   name:"Neutron",          stabilityOffset: 0.3,  durability:4, breakIn:"slow",   firmness:"medium"   },
  { manufacturer:"Axiom",   name:"Plasma",           stabilityOffset: 0.5,  durability:4, breakIn:"slow",   firmness:"firm"     },
  { manufacturer:"Axiom",   name:"Proton",           stabilityOffset: 0,    durability:4, breakIn:"slow",   firmness:"flexible" },
  { manufacturer:"Axiom",   name:"Fission",          stabilityOffset:-0.3,  durability:4, breakIn:"medium", firmness:"medium"   },
  { manufacturer:"Axiom",   name:"R2 Neutron",       stabilityOffset:-0.3,  durability:4, breakIn:"medium", firmness:"medium"   },
  { manufacturer:"Streamline",name:"Neutron",        stabilityOffset: 0.3,  durability:4, breakIn:"slow",   firmness:"medium"   },
  { manufacturer:"Streamline",name:"Plasma",         stabilityOffset: 0.5,  durability:4, breakIn:"slow",   firmness:"firm"     },
  { manufacturer:"Streamline",name:"Proton",         stabilityOffset: 0,    durability:4, breakIn:"slow",   firmness:"flexible" },

  // ── Kastaplast ───────────────────────────────────────────────────────────────
  { manufacturer:"Kastaplast", name:"K1",            stabilityOffset: 0.3,  durability:4, breakIn:"slow",   firmness:"medium"   },
  { manufacturer:"Kastaplast", name:"K1 Glow",       stabilityOffset: 0.5,  durability:4, breakIn:"slow",   firmness:"firm"     },
  { manufacturer:"Kastaplast", name:"K2",            stabilityOffset: 0.5,  durability:5, breakIn:"slow",   firmness:"firm"     },
  { manufacturer:"Kastaplast", name:"K3",            stabilityOffset:-0.3,  durability:4, breakIn:"medium", firmness:"medium"   },
  { manufacturer:"Kastaplast", name:"K1 Hard",       stabilityOffset: 0.5,  durability:5, breakIn:"slow",   firmness:"hard"     },
  { manufacturer:"Kastaplast", name:"K1 Soft",       stabilityOffset: 0,    durability:3, breakIn:"medium", firmness:"flexible" },

  // ── Discmania ────────────────────────────────────────────────────────────────
  { manufacturer:"Discmania", name:"S Line",         stabilityOffset: 0.5,  durability:5, breakIn:"slow",   firmness:"firm"     },
  { manufacturer:"Discmania", name:"G Line",         stabilityOffset: 0.3,  durability:4, breakIn:"slow",   firmness:"medium"   },
  { manufacturer:"Discmania", name:"C Line",         stabilityOffset:-0.3,  durability:4, breakIn:"medium", firmness:"medium"   },
  { manufacturer:"Discmania", name:"P Line",         stabilityOffset: 0.5,  durability:4, breakIn:"slow",   firmness:"firm"     },
  { manufacturer:"Discmania", name:"D Line",         stabilityOffset:-0.3,  durability:4, breakIn:"slow",   firmness:"flexible" },
  { manufacturer:"Discmania", name:"Active",         stabilityOffset:-0.5,  durability:3, breakIn:"fast",   firmness:"medium"   },

  // ── Mint Discs ───────────────────────────────────────────────────────────────
  { manufacturer:"Mint Discs", name:"Apex",          stabilityOffset: 0.5,  durability:5, breakIn:"slow",   firmness:"firm"     },
  { manufacturer:"Mint Discs", name:"Sublime",       stabilityOffset: 0.3,  durability:4, breakIn:"slow",   firmness:"medium"   },
  { manufacturer:"Mint Discs", name:"Eternal",       stabilityOffset:-0.3,  durability:4, breakIn:"medium", firmness:"medium"   },
  { manufacturer:"Mint Discs", name:"Royal Soft",    stabilityOffset:-0.5,  durability:3, breakIn:"fast",   firmness:"soft"     },

  // ── Thought Space Athletics ──────────────────────────────────────────────────
  { manufacturer:"Thought Space Athletics", name:"Nebula",   stabilityOffset: 0.5, durability:5, breakIn:"slow",   firmness:"firm"   },
  { manufacturer:"Thought Space Athletics", name:"Aura",     stabilityOffset: 0.3, durability:4, breakIn:"slow",   firmness:"medium" },
  { manufacturer:"Thought Space Athletics", name:"Ethereal", stabilityOffset:-0.3, durability:4, breakIn:"medium", firmness:"medium" },

  // ── Lone Star ────────────────────────────────────────────────────────────────
  { manufacturer:"Lone Star Disc", name:"Alpha",     stabilityOffset: 0,    durability:4, breakIn:"slow",   firmness:"flexible" },
  { manufacturer:"Lone Star Disc", name:"Bravo",     stabilityOffset:-0.3,  durability:4, breakIn:"slow",   firmness:"flexible" },
  { manufacturer:"Lone Star Disc", name:"Lima",      stabilityOffset: 0.5,  durability:4, breakIn:"slow",   firmness:"firm"     },

  // ── Discmania ─────────────────────────────────────────────────────────────────
  { manufacturer:"Discmania", name:"C-line",         stabilityOffset: 0.3,  durability:5, breakIn:"slow",   firmness:"firm"     },
  { manufacturer:"Discmania", name:"S-line",         stabilityOffset:-0.3,  durability:4, breakIn:"medium", firmness:"medium"   },
  { manufacturer:"Discmania", name:"Active",         stabilityOffset:-0.5,  durability:3, breakIn:"fast",   firmness:"medium"   },
  { manufacturer:"Discmania", name:"Evolution",      stabilityOffset: 0.5,  durability:5, breakIn:"slow",   firmness:"firm"     },
  { manufacturer:"Discmania", name:"Metal Flake C-line", stabilityOffset: 0.5, durability:5, breakIn:"slow", firmness:"firm"   },
  { manufacturer:"Discmania", name:"Special Blend S-line", stabilityOffset: 0, durability:4, breakIn:"slow", firmness:"flexible" },

  // ── Clash Discs ──────────────────────────────────────────────────────────────
  { manufacturer:"Clash Discs", name:"Softy",        stabilityOffset:-0.5, durability:3, breakIn:"fast",   firmness:"soft"     },
  { manufacturer:"Clash Discs", name:"Steady",       stabilityOffset: 0,   durability:4, breakIn:"slow",   firmness:"medium"   },
  { manufacturer:"Clash Discs", name:"Special Blend",stabilityOffset:-0.3, durability:4, breakIn:"medium", firmness:"flexible" },

  // ── Gateway ──────────────────────────────────────────────────────────────────
  { manufacturer:"Gateway", name:"Evolution Platinum",stabilityOffset: 0.5, durability:5, breakIn:"slow",   firmness:"firm"     },
  { manufacturer:"Gateway", name:"Evolution Diamond", stabilityOffset:-0.3, durability:4, breakIn:"medium", firmness:"medium"   },
  { manufacturer:"Gateway", name:"Super Soft",        stabilityOffset:-0.5, durability:3, breakIn:"fast",   firmness:"soft"     },
];

/** Get plastics for a specific manufacturer, sorted by stability (firm→soft) */
export function getPlasticsForManufacturer(manufacturer: string): PlasticRecord[] {
  return PLASTICS
    .filter(p => p.manufacturer.toLowerCase() === manufacturer.toLowerCase())
    .sort((a, b) => b.stabilityOffset - a.stabilityOffset);
}

/** Get all unique manufacturers that have plastic data */
export const PLASTIC_MANUFACTURERS = [...new Set(PLASTICS.map(p => p.manufacturer))].sort();

/** Find a plastic record */
export function findPlastic(manufacturer: string, plasticName: string): PlasticRecord | undefined {
  return PLASTICS.find(p =>
    p.manufacturer.toLowerCase() === manufacturer.toLowerCase() &&
    p.name.toLowerCase() === plasticName.toLowerCase()
  );
}

/** Effective stability adjustment from plastic */
export function plasticStabOffset(manufacturer: string | undefined, plasticName: string | undefined): number {
  if (!manufacturer || !plasticName) return 0;
  return findPlastic(manufacturer, plasticName)?.stabilityOffset ?? 0;
}
