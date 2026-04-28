/**
 * Community disc flight number database.
 * Update this file when new discs release or numbers get revised.
 * Speed/Glide/Turn/Fade are manufacturer-published numbers.
 */

export type DiscRecord = {
  manufacturer: string;
  name: string;
  type: "putter" | "midrange" | "fairway_driver" | "distance_driver";
  speed: number;
  glide: number;
  turn: number;
  fade: number;
};

export const DISC_DB: DiscRecord[] = [
  // ── Innova ──────────────────────────────────────────────────────────────
  { manufacturer: "Innova", name: "Aviar", type: "putter", speed: 2, glide: 3, turn: 0, fade: 1 },
  { manufacturer: "Innova", name: "Aviar3", type: "putter", speed: 3, glide: 3, turn: 0, fade: 2 },
  { manufacturer: "Innova", name: "Birdie", type: "putter", speed: 2, glide: 2, turn: 0, fade: 0 },
  { manufacturer: "Innova", name: "Dart", type: "putter", speed: 2, glide: 4, turn: -1, fade: 0 },
  { manufacturer: "Innova", name: "Dragon", type: "putter", speed: 2, glide: 4, turn: -3, fade: 0 },
  { manufacturer: "Innova", name: "Hydra", type: "putter", speed: 2, glide: 2, turn: 0, fade: 1 },
  { manufacturer: "Innova", name: "Invader", type: "putter", speed: 3, glide: 4, turn: -1, fade: 1 },
  { manufacturer: "Innova", name: "JK Aviar", type: "putter", speed: 2, glide: 3, turn: 0, fade: 1 },
  { manufacturer: "Innova", name: "Polecat", type: "putter", speed: 2, glide: 3, turn: 0, fade: 0 },
  { manufacturer: "Innova", name: "Rat", type: "putter", speed: 3, glide: 4, turn: 0, fade: 1 },
  { manufacturer: "Innova", name: "Rhyno", type: "putter", speed: 2, glide: 2, turn: 0, fade: 4 },
  { manufacturer: "Innova", name: "XCaliber", type: "putter", speed: 2, glide: 3, turn: 0, fade: 3 },
  { manufacturer: "Innova", name: "Colt", type: "putter", speed: 3, glide: 3, turn: 0, fade: 1 },

  { manufacturer: "Innova", name: "Banshee", type: "midrange", speed: 9, glide: 4, turn: -2, fade: 2 },
  { manufacturer: "Innova", name: "Cobra", type: "midrange", speed: 5, glide: 6, turn: -3, fade: 0 },
  { manufacturer: "Innova", name: "Condor", type: "midrange", speed: 4, glide: 3, turn: 0, fade: 3 },
  { manufacturer: "Innova", name: "Coyote", type: "midrange", speed: 4, glide: 5, turn: 0, fade: 2 },
  { manufacturer: "Innova", name: "Crow", type: "midrange", speed: 3, glide: 4, turn: -1, fade: 1 },
  { manufacturer: "Innova", name: "Gazelle", type: "midrange", speed: 5, glide: 6, turn: -2, fade: 1 },
  { manufacturer: "Innova", name: "Jaguar", type: "midrange", speed: 6, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Innova", name: "Leopard", type: "fairway_driver", speed: 6, glide: 5, turn: -2, fade: 1 },
  { manufacturer: "Innova", name: "Leopard3", type: "fairway_driver", speed: 7, glide: 5, turn: -2, fade: 1 },
  { manufacturer: "Innova", name: "Manta", type: "midrange", speed: 4, glide: 5, turn: -2, fade: 1 },
  { manufacturer: "Innova", name: "Panther", type: "midrange", speed: 4, glide: 4, turn: 0, fade: 2 },
  { manufacturer: "Innova", name: "Roc", type: "midrange", speed: 4, glide: 4, turn: 0, fade: 3 },
  { manufacturer: "Innova", name: "Roc3", type: "midrange", speed: 7, glide: 4, turn: 0, fade: 3 },
  { manufacturer: "Innova", name: "Shark", type: "midrange", speed: 4, glide: 4, turn: 0, fade: 2 },
  { manufacturer: "Innova", name: "Shark3", type: "midrange", speed: 5, glide: 4, turn: 0, fade: 3 },
  { manufacturer: "Innova", name: "Wolf", type: "midrange", speed: 5, glide: 4, turn: -1, fade: 2 },
  { manufacturer: "Innova", name: "Atlas", type: "midrange", speed: 5, glide: 5, turn: -1, fade: 2 },

  { manufacturer: "Innova", name: "Archangel", type: "fairway_driver", speed: 8, glide: 6, turn: -3, fade: 0 },
  { manufacturer: "Innova", name: "Fairway Driver", type: "fairway_driver", speed: 7, glide: 5, turn: 0, fade: 2 },
  { manufacturer: "Innova", name: "Firebird", type: "fairway_driver", speed: 9, glide: 3, turn: 0, fade: 4 },
  { manufacturer: "Innova", name: "Kite", type: "fairway_driver", speed: 8, glide: 6, turn: -2, fade: 2 },
  { manufacturer: "Innova", name: "Monsoon", type: "fairway_driver", speed: 9, glide: 4, turn: 0, fade: 4 },
  { manufacturer: "Innova", name: "Roadrunner", type: "fairway_driver", speed: 9, glide: 5, turn: -4, fade: 1 },
  { manufacturer: "Innova", name: "Skeeter", type: "fairway_driver", speed: 9, glide: 6, turn: -2, fade: 1 },
  { manufacturer: "Innova", name: "StarLite Sidewinder", type: "fairway_driver", speed: 9, glide: 5, turn: -3, fade: 1 },
  { manufacturer: "Innova", name: "Teebird", type: "fairway_driver", speed: 7, glide: 5, turn: 0, fade: 2 },
  { manufacturer: "Innova", name: "Teebird3", type: "fairway_driver", speed: 7, glide: 5, turn: 0, fade: 2 },
  { manufacturer: "Innova", name: "Thunderbird", type: "fairway_driver", speed: 9, glide: 5, turn: 0, fade: 3 },
  { manufacturer: "Innova", name: "Valkyrie", type: "fairway_driver", speed: 9, glide: 4, turn: -2, fade: 2 },
  { manufacturer: "Innova", name: "Victor", type: "fairway_driver", speed: 8, glide: 5, turn: -1, fade: 3 },

  { manufacturer: "Innova", name: "Ape", type: "distance_driver", speed: 13, glide: 5, turn: 0, fade: 3 },
  { manufacturer: "Innova", name: "Beast", type: "distance_driver", speed: 10, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Innova", name: "Boss", type: "distance_driver", speed: 13, glide: 5, turn: -1, fade: 3 },
  { manufacturer: "Innova", name: "Colossus", type: "distance_driver", speed: 13, glide: 6, turn: -3, fade: 2 },
  { manufacturer: "Innova", name: "Destroyer", type: "distance_driver", speed: 12, glide: 5, turn: -1, fade: 3 },
  { manufacturer: "Innova", name: "DX Boss", type: "distance_driver", speed: 13, glide: 4, turn: -2, fade: 3 },
  { manufacturer: "Innova", name: "Katana", type: "distance_driver", speed: 13, glide: 5, turn: -3, fade: 3 },
  { manufacturer: "Innova", name: "Mystere", type: "distance_driver", speed: 11, glide: 6, turn: -2, fade: 2 },
  { manufacturer: "Innova", name: "Nuke", type: "distance_driver", speed: 13, glide: 5, turn: -1, fade: 3 },
  { manufacturer: "Innova", name: "Shryke", type: "distance_driver", speed: 13, glide: 6, turn: -2, fade: 2 },
  { manufacturer: "Innova", name: "Sidewinder", type: "distance_driver", speed: 9, glide: 5, turn: -3, fade: 1 },
  { manufacturer: "Innova", name: "TeeDevil", type: "distance_driver", speed: 12, glide: 6, turn: -2, fade: 2 },
  { manufacturer: "Innova", name: "Vroc", type: "distance_driver", speed: 10, glide: 4, turn: 0, fade: 3 },
  { manufacturer: "Innova", name: "Wraith", type: "distance_driver", speed: 11, glide: 5, turn: -1, fade: 3 },

  // ── Discraft ─────────────────────────────────────────────────────────────
  { manufacturer: "Discraft", name: "Ace", type: "putter", speed: 3, glide: 3, turn: 0, fade: 2 },
  { manufacturer: "Discraft", name: "Avenger", type: "putter", speed: 2, glide: 3, turn: 0, fade: 1 },
  { manufacturer: "Discraft", name: "Banger GT", type: "putter", speed: 2, glide: 3, turn: 0, fade: 3 },
  { manufacturer: "Discraft", name: "Fierce", type: "putter", speed: 3, glide: 3, turn: 0, fade: 1 },
  { manufacturer: "Discraft", name: "Luna", type: "putter", speed: 3, glide: 3, turn: 0, fade: 3 },
  { manufacturer: "Discraft", name: "Magnet", type: "putter", speed: 2, glide: 4, turn: -1, fade: 0 },
  { manufacturer: "Discraft", name: "Soft Magnet", type: "putter", speed: 2, glide: 4, turn: -1, fade: 0 },
  { manufacturer: "Discraft", name: "Bro-D", type: "putter", speed: 3, glide: 3, turn: 0, fade: 1 },
  { manufacturer: "Discraft", name: "Zone", type: "putter", speed: 4, glide: 3, turn: 0, fade: 3 },

  { manufacturer: "Discraft", name: "Buzzz", type: "midrange", speed: 5, glide: 4, turn: -1, fade: 1 },
  { manufacturer: "Discraft", name: "Buzzz GT", type: "midrange", speed: 5, glide: 4, turn: -1, fade: 1 },
  { manufacturer: "Discraft", name: "Buzzz OS", type: "midrange", speed: 5, glide: 3, turn: 0, fade: 3 },
  { manufacturer: "Discraft", name: "Comet", type: "midrange", speed: 4, glide: 5, turn: -2, fade: 1 },
  { manufacturer: "Discraft", name: "Drone", type: "midrange", speed: 6, glide: 4, turn: 0, fade: 3 },
  { manufacturer: "Discraft", name: "Flash", type: "midrange", speed: 9, glide: 4, turn: -2, fade: 1 },
  { manufacturer: "Discraft", name: "Meteor", type: "midrange", speed: 4, glide: 5, turn: -3, fade: 1 },
  { manufacturer: "Discraft", name: "Sol", type: "midrange", speed: 5, glide: 5, turn: -1, fade: 1 },
  { manufacturer: "Discraft", name: "Stratus", type: "midrange", speed: 5, glide: 5, turn: -3, fade: 1 },
  { manufacturer: "Discraft", name: "Wasp", type: "midrange", speed: 5, glide: 4, turn: 0, fade: 2 },

  { manufacturer: "Discraft", name: "Avenger SS", type: "fairway_driver", speed: 10, glide: 5, turn: -3, fade: 1 },
  { manufacturer: "Discraft", name: "Buzzz FLX", type: "fairway_driver", speed: 7, glide: 5, turn: -1, fade: 2 },
  { manufacturer: "Discraft", name: "Challenger", type: "fairway_driver", speed: 4, glide: 4, turn: 0, fade: 2 },
  { manufacturer: "Discraft", name: "Ringer GT", type: "fairway_driver", speed: 7, glide: 3, turn: 0, fade: 3 },
  { manufacturer: "Discraft", name: "Stalker", type: "fairway_driver", speed: 7, glide: 4, turn: -1, fade: 2 },
  { manufacturer: "Discraft", name: "Sting", type: "fairway_driver", speed: 6, glide: 5, turn: -1, fade: 2 },
  { manufacturer: "Discraft", name: "Undertaker", type: "fairway_driver", speed: 9, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Discraft", name: "XS", type: "fairway_driver", speed: 9, glide: 5, turn: -2, fade: 2 },

  { manufacturer: "Discraft", name: "Anax", type: "distance_driver", speed: 13, glide: 6, turn: -2, fade: 2 },
  { manufacturer: "Discraft", name: "APX", type: "distance_driver", speed: 12, glide: 5, turn: -2, fade: 3 },
  { manufacturer: "Discraft", name: "Crank SS", type: "distance_driver", speed: 13, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Discraft", name: "ESP Force", type: "distance_driver", speed: 12, glide: 5, turn: -0.5, fade: 3 },
  { manufacturer: "Discraft", name: "Force", type: "distance_driver", speed: 12, glide: 5, turn: -0.5, fade: 3 },
  { manufacturer: "Discraft", name: "Nuke", type: "distance_driver", speed: 13, glide: 5, turn: -1, fade: 3 },
  { manufacturer: "Discraft", name: "Nuke SS", type: "distance_driver", speed: 13, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Discraft", name: "Scorch", type: "distance_driver", speed: 13, glide: 6, turn: -2, fade: 2 },
  { manufacturer: "Discraft", name: "Surge", type: "distance_driver", speed: 11, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Discraft", name: "Surge SS", type: "distance_driver", speed: 11, glide: 5, turn: -3, fade: 2 },
  { manufacturer: "Discraft", name: "Thrasher", type: "distance_driver", speed: 12, glide: 5, turn: -3, fade: 1 },
  { manufacturer: "Discraft", name: "Vulture", type: "distance_driver", speed: 10, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Discraft", name: "Zeus", type: "distance_driver", speed: 12, glide: 5, turn: -1, fade: 3 },

  // ── Dynamic Discs ─────────────────────────────────────────────────────────
  { manufacturer: "Dynamic Discs", name: "Classic Soft Judge", type: "putter", speed: 2, glide: 4, turn: 0, fade: 1 },
  { manufacturer: "Dynamic Discs", name: "Judge", type: "putter", speed: 2, glide: 4, turn: 0, fade: 1 },
  { manufacturer: "Dynamic Discs", name: "Deputy", type: "putter", speed: 2, glide: 4, turn: -1, fade: 1 },
  { manufacturer: "Dynamic Discs", name: "Warden", type: "putter", speed: 2, glide: 3, turn: -1, fade: 1 },

  { manufacturer: "Dynamic Discs", name: "EMac Truth", type: "midrange", speed: 5, glide: 5, turn: 0, fade: 2 },
  { manufacturer: "Dynamic Discs", name: "Truth", type: "midrange", speed: 5, glide: 6, turn: 0, fade: 2 },
  { manufacturer: "Dynamic Discs", name: "Verdict", type: "midrange", speed: 5, glide: 4, turn: 0, fade: 3 },

  { manufacturer: "Dynamic Discs", name: "Escape", type: "fairway_driver", speed: 9, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Dynamic Discs", name: "Freedom", type: "fairway_driver", speed: 8, glide: 6, turn: -2, fade: 1 },
  { manufacturer: "Dynamic Discs", name: "Sentinel", type: "fairway_driver", speed: 7, glide: 4, turn: 0, fade: 3 },
  { manufacturer: "Dynamic Discs", name: "Trespass", type: "fairway_driver", speed: 10, glide: 5, turn: -1, fade: 3 },
  { manufacturer: "Dynamic Discs", name: "Witness", type: "fairway_driver", speed: 8, glide: 5, turn: -2, fade: 2 },

  { manufacturer: "Dynamic Discs", name: "Breakout", type: "distance_driver", speed: 13, glide: 5, turn: -2, fade: 3 },
  { manufacturer: "Dynamic Discs", name: "Convict", type: "distance_driver", speed: 12, glide: 5, turn: -1, fade: 3 },
  { manufacturer: "Dynamic Discs", name: "Felon", type: "distance_driver", speed: 12, glide: 5, turn: -0.5, fade: 3 },
  { manufacturer: "Dynamic Discs", name: "Gangster", type: "distance_driver", speed: 14, glide: 5, turn: -1, fade: 3 },
  { manufacturer: "Dynamic Discs", name: "Maverick", type: "distance_driver", speed: 10, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Dynamic Discs", name: "Renegade", type: "distance_driver", speed: 10, glide: 6, turn: -2, fade: 2 },
  { manufacturer: "Dynamic Discs", name: "Sheriff", type: "distance_driver", speed: 13, glide: 5, turn: -2, fade: 2 },

  // ── Latitude 64 ──────────────────────────────────────────────────────────
  { manufacturer: "Latitude 64", name: "Bliss", type: "putter", speed: 2, glide: 4, turn: -1, fade: 1 },
  { manufacturer: "Latitude 64", name: "Diamond", type: "fairway_driver", speed: 7, glide: 6, turn: -3, fade: 1 },
  { manufacturer: "Latitude 64", name: "Explorer", type: "fairway_driver", speed: 9, glide: 5, turn: -1, fade: 2 },
  { manufacturer: "Latitude 64", name: "Flow", type: "fairway_driver", speed: 9, glide: 6, turn: -3, fade: 1 },
  { manufacturer: "Latitude 64", name: "Fuse", type: "midrange", speed: 5, glide: 6, turn: -1, fade: 1 },
  { manufacturer: "Latitude 64", name: "Jade", type: "fairway_driver", speed: 9, glide: 6, turn: -2, fade: 2 },
  { manufacturer: "Latitude 64", name: "Pure", type: "putter", speed: 2, glide: 3, turn: 0, fade: 1 },
  { manufacturer: "Latitude 64", name: "River", type: "fairway_driver", speed: 7, glide: 7, turn: -1, fade: 1 },
  { manufacturer: "Latitude 64", name: "Saint", type: "fairway_driver", speed: 8, glide: 6, turn: -1, fade: 2 },
  { manufacturer: "Latitude 64", name: "Stiletto", type: "distance_driver", speed: 14, glide: 4, turn: -0.5, fade: 4 },
  { manufacturer: "Latitude 64", name: "Trust", type: "putter", speed: 2, glide: 5, turn: 0, fade: 1 },
  { manufacturer: "Latitude 64", name: "Volt", type: "distance_driver", speed: 10, glide: 4, turn: -0.5, fade: 3 },
  { manufacturer: "Latitude 64", name: "Opto Grace", type: "distance_driver", speed: 11, glide: 6, turn: -1, fade: 3 },

  // ── Kastaplast ───────────────────────────────────────────────────────────
  { manufacturer: "Kastaplast", name: "Berg", type: "putter", speed: 1, glide: 1, turn: 0, fade: 2 },
  { manufacturer: "Kastaplast", name: "Gote", type: "putter", speed: 3, glide: 3, turn: 0, fade: 1 },
  { manufacturer: "Kastaplast", name: "Kaxe", type: "midrange", speed: 6, glide: 4, turn: 0, fade: 3 },
  { manufacturer: "Kastaplast", name: "Kaxe Z", type: "midrange", speed: 6, glide: 4, turn: -1, fade: 2 },
  { manufacturer: "Kastaplast", name: "Lots", type: "fairway_driver", speed: 8, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Kastaplast", name: "Rask", type: "distance_driver", speed: 13, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Kastaplast", name: "Stig", type: "fairway_driver", speed: 8, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Kastaplast", name: "Falk", type: "distance_driver", speed: 11, glide: 5, turn: -1, fade: 3 },

  // ── MVP / Axiom / Streamline ─────────────────────────────────────────────
  { manufacturer: "MVP", name: "Atom", type: "putter", speed: 2.5, glide: 3, turn: -0.5, fade: 1 },
  { manufacturer: "MVP", name: "Anode", type: "putter", speed: 2, glide: 3, turn: 0, fade: 1 },
  { manufacturer: "MVP", name: "Envy", type: "putter", speed: 3, glide: 4, turn: 0, fade: 2 },
  { manufacturer: "MVP", name: "Paradox", type: "putter", speed: 2.5, glide: 4, turn: 0, fade: 2 },
  { manufacturer: "MVP", name: "Disc Soft Ion", type: "putter", speed: 3, glide: 4, turn: 0, fade: 1 },
  { manufacturer: "MVP", name: "Orbital", type: "distance_driver", speed: 14, glide: 5, turn: -1, fade: 3 },
  { manufacturer: "MVP", name: "Octane", type: "distance_driver", speed: 13, glide: 5, turn: -2, fade: 3 },
  { manufacturer: "MVP", name: "Signal", type: "midrange", speed: 5, glide: 5, turn: -0.5, fade: 2 },
  { manufacturer: "MVP", name: "Theory", type: "distance_driver", speed: 10, glide: 5, turn: -1, fade: 2 },
  { manufacturer: "Axiom", name: "Insanity", type: "distance_driver", speed: 14, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Axiom", name: "Defy", type: "distance_driver", speed: 14, glide: 5.5, turn: -3, fade: 1.5 },
  { manufacturer: "Axiom", name: "Crave", type: "fairway_driver", speed: 8, glide: 5.5, turn: -2, fade: 2 },
  { manufacturer: "Axiom", name: "Virus", type: "fairway_driver", speed: 8, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Axiom", name: "Hex", type: "midrange", speed: 5, glide: 5, turn: -1, fade: 2 },
  { manufacturer: "Streamline", name: "Trace", type: "fairway_driver", speed: 9, glide: 5, turn: -3, fade: 1 },
  { manufacturer: "Streamline", name: "Drift", type: "midrange", speed: 4, glide: 6, turn: -2, fade: 1 },

  // ── Discmania ─────────────────────────────────────────────────────────────
  { manufacturer: "Discmania", name: "P2", type: "putter", speed: 2, glide: 3, turn: 0, fade: 1 },
  { manufacturer: "Discmania", name: "P1", type: "putter", speed: 2, glide: 3, turn: 0, fade: 2 },
  { manufacturer: "Discmania", name: "P3", type: "putter", speed: 3, glide: 3, turn: 0, fade: 2 },
  { manufacturer: "Discmania", name: "Instinct", type: "putter", speed: 4, glide: 5, turn: 0, fade: 2 },
  { manufacturer: "Discmania", name: "MD1", type: "midrange", speed: 5, glide: 5, turn: 0, fade: 2 },
  { manufacturer: "Discmania", name: "MD3", type: "midrange", speed: 5, glide: 6, turn: -1, fade: 2 },
  { manufacturer: "Discmania", name: "MD5", type: "midrange", speed: 6, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Discmania", name: "Essence", type: "fairway_driver", speed: 8, glide: 6, turn: -2, fade: 1 },
  { manufacturer: "Discmania", name: "FD", type: "fairway_driver", speed: 7, glide: 6, turn: -2, fade: 1 },
  { manufacturer: "Discmania", name: "FD3", type: "fairway_driver", speed: 9, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Discmania", name: "FD5", type: "fairway_driver", speed: 9, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Discmania", name: "PD", type: "fairway_driver", speed: 10, glide: 4, turn: -1, fade: 3 },
  { manufacturer: "Discmania", name: "PD2", type: "fairway_driver", speed: 10, glide: 3, turn: 0, fade: 4 },
  { manufacturer: "Discmania", name: "CD", type: "distance_driver", speed: 12, glide: 5, turn: -1, fade: 2 },
  { manufacturer: "Discmania", name: "CD2", type: "distance_driver", speed: 12, glide: 5, turn: -2, fade: 3 },
  { manufacturer: "Discmania", name: "CD3", type: "distance_driver", speed: 12, glide: 5, turn: -1, fade: 3 },
  { manufacturer: "Discmania", name: "PD Leader", type: "distance_driver", speed: 11, glide: 5, turn: -1, fade: 3 },

  // ── Prodigy ───────────────────────────────────────────────────────────────
  { manufacturer: "Prodigy", name: "A1", type: "putter", speed: 2.5, glide: 4, turn: 0, fade: 2 },
  { manufacturer: "Prodigy", name: "A2", type: "putter", speed: 2.5, glide: 3, turn: -0.5, fade: 3 },
  { manufacturer: "Prodigy", name: "A3", type: "putter", speed: 2.5, glide: 3, turn: -0.5, fade: 2 },
  { manufacturer: "Prodigy", name: "A4", type: "putter", speed: 3, glide: 4, turn: -1, fade: 1 },
  { manufacturer: "Prodigy", name: "M2", type: "midrange", speed: 5, glide: 5, turn: -1, fade: 2 },
  { manufacturer: "Prodigy", name: "M3", type: "midrange", speed: 5, glide: 4, turn: 0, fade: 3 },
  { manufacturer: "Prodigy", name: "M4", type: "midrange", speed: 4, glide: 4, turn: -1, fade: 2 },
  { manufacturer: "Prodigy", name: "F1", type: "fairway_driver", speed: 9, glide: 5, turn: 0, fade: 3 },
  { manufacturer: "Prodigy", name: "F3", type: "fairway_driver", speed: 9, glide: 5, turn: -1, fade: 3 },
  { manufacturer: "Prodigy", name: "F5", type: "fairway_driver", speed: 8, glide: 6, turn: -2, fade: 1 },
  { manufacturer: "Prodigy", name: "F7", type: "fairway_driver", speed: 7, glide: 6, turn: -3, fade: 1 },
  { manufacturer: "Prodigy", name: "D1", type: "distance_driver", speed: 13, glide: 5, turn: -1, fade: 4 },
  { manufacturer: "Prodigy", name: "D2", type: "distance_driver", speed: 13, glide: 5, turn: -2, fade: 3 },
  { manufacturer: "Prodigy", name: "D3", type: "distance_driver", speed: 12, glide: 5, turn: -1, fade: 3 },

  // ── Clash Discs ──────────────────────────────────────────────────────────
  { manufacturer: "Clash Discs", name: "Mango", type: "putter", speed: 2, glide: 3, turn: 0, fade: 1 },
  { manufacturer: "Clash Discs", name: "Peach", type: "putter", speed: 2, glide: 4, turn: -1, fade: 1 },
  { manufacturer: "Clash Discs", name: "Mint", type: "midrange", speed: 5, glide: 5, turn: -2, fade: 1 },
  { manufacturer: "Clash Discs", name: "Blueberry", type: "midrange", speed: 5, glide: 5, turn: 0, fade: 3 },
  { manufacturer: "Clash Discs", name: "Coral", type: "fairway_driver", speed: 8, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Clash Discs", name: "Berry", type: "fairway_driver", speed: 8, glide: 5, turn: -2, fade: 2 },

  // ── Thought Space Athletics ───────────────────────────────────────────────
  { manufacturer: "Thought Space Athletics", name: "Animus", type: "putter", speed: 2, glide: 3, turn: 0, fade: 2 },
  { manufacturer: "Thought Space Athletics", name: "Construct", type: "fairway_driver", speed: 8, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Thought Space Athletics", name: "Pathfinder", type: "midrange", speed: 5, glide: 5, turn: -2, fade: 1 },
  { manufacturer: "Thought Space Athletics", name: "Synapse", type: "distance_driver", speed: 13, glide: 5, turn: -2, fade: 2 },

  // ── Gateway ───────────────────────────────────────────────────────────────
  { manufacturer: "Gateway", name: "Wizard", type: "putter", speed: 2, glide: 3, turn: 0, fade: 1 },
  { manufacturer: "Gateway", name: "Warlock", type: "putter", speed: 2, glide: 3, turn: 0, fade: 3 },
  { manufacturer: "Gateway", name: "Voodoo", type: "putter", speed: 2, glide: 4, turn: -1, fade: 1 },

  // ── Westside Discs ────────────────────────────────────────────────────────
  { manufacturer: "Westside Discs", name: "Harp", type: "putter", speed: 4, glide: 3, turn: 0, fade: 3 },
  { manufacturer: "Westside Discs", name: "Swan 1", type: "putter", speed: 2, glide: 3, turn: 0, fade: 0 },
  { manufacturer: "Westside Discs", name: "Swan 2", type: "putter", speed: 2, glide: 4, turn: -1, fade: 2 },
  { manufacturer: "Westside Discs", name: "Tursas", type: "midrange", speed: 6, glide: 4, turn: 0, fade: 3 },
  { manufacturer: "Westside Discs", name: "Warship", type: "midrange", speed: 5, glide: 5, turn: -1, fade: 2 },
  { manufacturer: "Westside Discs", name: "Longbowman", type: "fairway_driver", speed: 9, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Westside Discs", name: "World", type: "distance_driver", speed: 14, glide: 5, turn: -1, fade: 3 },
  { manufacturer: "Westside Discs", name: "Burst", type: "distance_driver", speed: 13, glide: 5, turn: -2, fade: 2 },

  // ── Mint Discs ────────────────────────────────────────────────────────────
  { manufacturer: "Mint Discs", name: "Jackalope", type: "putter", speed: 3, glide: 4, turn: 0, fade: 1 },
  { manufacturer: "Mint Discs", name: "Longhorn", type: "putter", speed: 2, glide: 4, turn: -1, fade: 1 },
  { manufacturer: "Mint Discs", name: "Mustang", type: "midrange", speed: 5, glide: 5, turn: -1, fade: 2 },
  { manufacturer: "Mint Discs", name: "Rattler", type: "fairway_driver", speed: 8, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Mint Discs", name: "Bobcat", type: "distance_driver", speed: 11, glide: 5, turn: -2, fade: 2 },

  // ── Elevation Disc Golf ───────────────────────────────────────────────────
  { manufacturer: "Elevation", name: "Alpenglow", type: "putter", speed: 2, glide: 3, turn: 0, fade: 1 },
  { manufacturer: "Elevation", name: "Alpenglow Rush", type: "putter", speed: 3, glide: 4, turn: -1, fade: 1 },

  // ── Løkid Disc Golf ───────────────────────────────────────────────────────
  { manufacturer: "Løkid", name: "Loki", type: "putter", speed: 2, glide: 3, turn: 0, fade: 2 },

  // ── More Innova ───────────────────────────────────────────────────────────
  { manufacturer: "Innova", name: "Eagle", type: "fairway_driver", speed: 7, glide: 5, turn: -1, fade: 3 },
  { manufacturer: "Innova", name: "Eagle X", type: "fairway_driver", speed: 7, glide: 4, turn: 0, fade: 3 },
  { manufacturer: "Innova", name: "Gator", type: "midrange", speed: 6, glide: 4, turn: 0, fade: 3 },
  { manufacturer: "Innova", name: "Gator3", type: "midrange", speed: 6, glide: 4, turn: 0, fade: 3 },
  { manufacturer: "Innova", name: "Hawkteye", type: "fairway_driver", speed: 8, glide: 4, turn: 0, fade: 3 },
  { manufacturer: "Innova", name: "Lion", type: "midrange", speed: 4, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Innova", name: "Liger", type: "midrange", speed: 6, glide: 5, turn: 0, fade: 3 },
  { manufacturer: "Innova", name: "Mamba", type: "distance_driver", speed: 11, glide: 6, turn: -5, fade: 1 },
  { manufacturer: "Innova", name: "Nova", type: "putter", speed: 2, glide: 4, turn: -1, fade: 0 },
  { manufacturer: "Innova", name: "Orc", type: "distance_driver", speed: 12, glide: 5, turn: -1, fade: 3 },
  { manufacturer: "Innova", name: "Phantom", type: "distance_driver", speed: 11, glide: 6, turn: -2, fade: 2 },
  { manufacturer: "Innova", name: "Pig", type: "putter", speed: 3, glide: 1, turn: 0, fade: 3 },
  { manufacturer: "Innova", name: "Python", type: "distance_driver", speed: 12, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Innova", name: "Stingray", type: "midrange", speed: 4, glide: 6, turn: -4, fade: 0 },
  { manufacturer: "Innova", name: "TeeBird3", type: "fairway_driver", speed: 7, glide: 5, turn: 0, fade: 2 },

  // ── More Discraft ─────────────────────────────────────────────────────────
  { manufacturer: "Discraft", name: "Archer", type: "fairway_driver", speed: 6, glide: 4, turn: -2, fade: 2 },
  { manufacturer: "Discraft", name: "Crank", type: "distance_driver", speed: 13, glide: 5, turn: -1, fade: 3 },
  { manufacturer: "Discraft", name: "Cyclone", type: "distance_driver", speed: 13, glide: 5, turn: -3, fade: 2 },
  { manufacturer: "Discraft", name: "Heat", type: "fairway_driver", speed: 9, glide: 6, turn: -3, fade: 1 },
  { manufacturer: "Discraft", name: "Hades", type: "distance_driver", speed: 12, glide: 6, turn: -3, fade: 2 },
  { manufacturer: "Discraft", name: "Hornet", type: "midrange", speed: 5, glide: 4, turn: 0, fade: 3 },
  { manufacturer: "Discraft", name: "Mantis", type: "fairway_driver", speed: 10, glide: 4, turn: 0, fade: 3 },
  { manufacturer: "Discraft", name: "Nebula", type: "distance_driver", speed: 10, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Discraft", name: "Phantom", type: "fairway_driver", speed: 9, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Discraft", name: "Roach", type: "putter", speed: 2, glide: 4, turn: 0, fade: 1 },
  { manufacturer: "Discraft", name: "Raptor", type: "fairway_driver", speed: 10, glide: 4, turn: 0, fade: 3 },
  { manufacturer: "Discraft", name: "Talon", type: "distance_driver", speed: 10, glide: 4, turn: -2, fade: 3 },
  { manufacturer: "Discraft", name: "Typhoon", type: "distance_driver", speed: 12, glide: 5, turn: -2, fade: 3 },

  // ── More Dynamic Discs ────────────────────────────────────────────────────
  { manufacturer: "Dynamic Discs", name: "Evidence", type: "midrange", speed: 4, glide: 5, turn: 0, fade: 3 },
  { manufacturer: "Dynamic Discs", name: "Getaway", type: "fairway_driver", speed: 9, glide: 6, turn: -3, fade: 1 },
  { manufacturer: "Dynamic Discs", name: "Raider", type: "distance_driver", speed: 11, glide: 6, turn: -2, fade: 3 },
  { manufacturer: "Dynamic Discs", name: "Suspect", type: "midrange", speed: 4, glide: 4, turn: 0, fade: 3 },
  { manufacturer: "Dynamic Discs", name: "Token", type: "putter", speed: 2, glide: 4, turn: 0, fade: 1 },

  // ── More Latitude 64 ─────────────────────────────────────────────────────
  { manufacturer: "Latitude 64", name: "Burner", type: "distance_driver", speed: 13, glide: 5, turn: -1, fade: 3 },
  { manufacturer: "Latitude 64", name: "Compass", type: "midrange", speed: 5, glide: 5, turn: -1, fade: 2 },
  { manufacturer: "Latitude 64", name: "Gauntlet", type: "distance_driver", speed: 13, glide: 5, turn: 0, fade: 4 },
  { manufacturer: "Latitude 64", name: "Halo", type: "putter", speed: 3, glide: 4, turn: 0, fade: 2 },
  { manufacturer: "Latitude 64", name: "Raketen", type: "distance_driver", speed: 14, glide: 4, turn: 0, fade: 3 },
  { manufacturer: "Latitude 64", name: "Sapphire", type: "distance_driver", speed: 11, glide: 6, turn: -3, fade: 2 },
  { manufacturer: "Latitude 64", name: "Scythe", type: "distance_driver", speed: 12, glide: 5, turn: -2, fade: 3 },
  { manufacturer: "Latitude 64", name: "Spike", type: "fairway_driver", speed: 8, glide: 4, turn: -1, fade: 4 },
  { manufacturer: "Latitude 64", name: "Underworld", type: "putter", speed: 3, glide: 4, turn: -1, fade: 2 },

  // ── More MVP ──────────────────────────────────────────────────────────────
  { manufacturer: "MVP", name: "Catalyst", type: "distance_driver", speed: 13, glide: 5.5, turn: -2, fade: 2 },
  { manufacturer: "MVP", name: "Deflector", type: "distance_driver", speed: 12, glide: 5, turn: -3, fade: 1.5 },
  { manufacturer: "MVP", name: "Dimension", type: "distance_driver", speed: 14, glide: 5, turn: -1, fade: 3 },
  { manufacturer: "MVP", name: "Disc Soft Ion", type: "putter", speed: 3, glide: 4, turn: 0, fade: 1 },
  { manufacturer: "MVP", name: "Electron Disc Ion", type: "putter", speed: 3, glide: 3, turn: 0, fade: 1 },
  { manufacturer: "MVP", name: "Matrix", type: "fairway_driver", speed: 9, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "MVP", name: "Photon", type: "distance_driver", speed: 12, glide: 5, turn: -0.5, fade: 3 },
  { manufacturer: "MVP", name: "Proxy", type: "putter", speed: 3, glide: 4, turn: -1, fade: 1 },
  { manufacturer: "MVP", name: "Resistor", type: "fairway_driver", speed: 8, glide: 4, turn: 0, fade: 4 },
  { manufacturer: "MVP", name: "Servo", type: "putter", speed: 3, glide: 3, turn: 0, fade: 1 },
  { manufacturer: "MVP", name: "Spiral", type: "distance_driver", speed: 14, glide: 6, turn: -3, fade: 1 },
  { manufacturer: "MVP", name: "Volt", type: "fairway_driver", speed: 9, glide: 5, turn: -1, fade: 2 },

  // ── More Axiom ────────────────────────────────────────────────────────────
  { manufacturer: "Axiom", name: "Disarray", type: "distance_driver", speed: 13, glide: 5, turn: -4, fade: 2 },
  { manufacturer: "Axiom", name: "Fireball", type: "distance_driver", speed: 12, glide: 5, turn: -0.5, fade: 4 },
  { manufacturer: "Axiom", name: "Mayhem", type: "distance_driver", speed: 13, glide: 5, turn: -2, fade: 3 },
  { manufacturer: "Axiom", name: "Panic", type: "distance_driver", speed: 13.5, glide: 5, turn: -1, fade: 3 },
  { manufacturer: "Axiom", name: "Proxy", type: "putter", speed: 3, glide: 4, turn: -1, fade: 1 },
  { manufacturer: "Axiom", name: "Rhythm", type: "midrange", speed: 5, glide: 5, turn: -0.5, fade: 2 },
  { manufacturer: "Axiom", name: "Vanish", type: "distance_driver", speed: 12, glide: 6, turn: -4, fade: 1 },

  // ── More Streamline ───────────────────────────────────────────────────────
  { manufacturer: "Streamline", name: "Escape", type: "distance_driver", speed: 11, glide: 5, turn: -3, fade: 2 },
  { manufacturer: "Streamline", name: "Lift", type: "fairway_driver", speed: 9, glide: 5, turn: -2, fade: 1 },
  { manufacturer: "Streamline", name: "Pilot", type: "putter", speed: 3, glide: 4, turn: 0, fade: 1 },
  { manufacturer: "Streamline", name: "Signal", type: "midrange", speed: 5, glide: 5, turn: -0.5, fade: 2 },
  { manufacturer: "Streamline", name: "Stabilizer", type: "distance_driver", speed: 12, glide: 5, turn: 0, fade: 4 },

  // ── More Mint Discs ───────────────────────────────────────────────────────
  { manufacturer: "Mint Discs", name: "Freetail", type: "distance_driver", speed: 13, glide: 6, turn: -3, fade: 2 },
  { manufacturer: "Mint Discs", name: "Mamba", type: "fairway_driver", speed: 7, glide: 5, turn: -1, fade: 2 },
  { manufacturer: "Mint Discs", name: "Stingray", type: "midrange", speed: 4, glide: 5, turn: -2, fade: 1 },

  // ── More Kastaplast ───────────────────────────────────────────────────────
  { manufacturer: "Kastaplast", name: "Grym", type: "distance_driver", speed: 12, glide: 5, turn: -1, fade: 3 },
  { manufacturer: "Kastaplast", name: "Grym X", type: "distance_driver", speed: 12, glide: 5, turn: 0, fade: 3 },
  { manufacturer: "Kastaplast", name: "Kaxe Z", type: "midrange", speed: 6, glide: 4, turn: -1, fade: 2 },
  { manufacturer: "Kastaplast", name: "Stab", type: "putter", speed: 2, glide: 3, turn: 0, fade: 1 },

  // ── More Discmania ────────────────────────────────────────────────────────
  { manufacturer: "Discmania", name: "Active", type: "midrange", speed: 4, glide: 5, turn: -1, fade: 1 },
  { manufacturer: "Discmania", name: "DD", type: "distance_driver", speed: 13, glide: 5, turn: -1, fade: 3 },
  { manufacturer: "Discmania", name: "DD2", type: "distance_driver", speed: 13, glide: 5, turn: -2, fade: 3 },
  { manufacturer: "Discmania", name: "DD3", type: "distance_driver", speed: 13, glide: 6, turn: -2, fade: 3 },
  { manufacturer: "Discmania", name: "FD2", type: "fairway_driver", speed: 8, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Discmania", name: "Logic", type: "midrange", speed: 4, glide: 5, turn: -1, fade: 2 },
  { manufacturer: "Discmania", name: "MD4", type: "midrange", speed: 5, glide: 5, turn: -2, fade: 1 },
  { manufacturer: "Discmania", name: "P1x", type: "putter", speed: 2, glide: 3, turn: 0, fade: 2 },
  { manufacturer: "Discmania", name: "Sensei", type: "putter", speed: 2, glide: 4, turn: 0, fade: 2 },
  { manufacturer: "Discmania", name: "Tactic", type: "fairway_driver", speed: 7, glide: 5, turn: -1, fade: 2 },

  // ── More Prodigy ──────────────────────────────────────────────────────────
  { manufacturer: "Prodigy", name: "400 D4", type: "distance_driver", speed: 14, glide: 5, turn: -2, fade: 3 },
  { manufacturer: "Prodigy", name: "D4", type: "distance_driver", speed: 14, glide: 5, turn: -2, fade: 3 },
  { manufacturer: "Prodigy", name: "F2", type: "fairway_driver", speed: 10, glide: 5, turn: 0, fade: 3 },
  { manufacturer: "Prodigy", name: "H3 V2", type: "fairway_driver", speed: 8, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Prodigy", name: "M1", type: "midrange", speed: 4, glide: 5, turn: 0, fade: 3 },
  { manufacturer: "Prodigy", name: "P4", type: "putter", speed: 3, glide: 4, turn: 0, fade: 1 },

  // ── Clash Discs ───────────────────────────────────────────────────────────
  { manufacturer: "Clash Discs", name: "Butter", type: "putter", speed: 2, glide: 5, turn: -1, fade: 1 },
  { manufacturer: "Clash Discs", name: "Cherry", type: "midrange", speed: 5, glide: 5, turn: -1, fade: 2 },
  { manufacturer: "Clash Discs", name: "Popcorn", type: "distance_driver", speed: 12, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Clash Discs", name: "Spice", type: "putter", speed: 2, glide: 4, turn: 0, fade: 2 },
  { manufacturer: "Clash Discs", name: "Soda", type: "midrange", speed: 5, glide: 6, turn: -2, fade: 1 },

  // ── Thought Space Athletics ───────────────────────────────────────────────
  { manufacturer: "Thought Space Athletics", name: "Votum", type: "putter", speed: 3, glide: 4, turn: 0, fade: 2 },
  { manufacturer: "Thought Space Athletics", name: "Ethos", type: "midrange", speed: 5, glide: 5, turn: -2, fade: 1 },
  { manufacturer: "Thought Space Athletics", name: "Arch", type: "fairway_driver", speed: 8, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Thought Space Athletics", name: "Mantra", type: "distance_driver", speed: 13, glide: 5, turn: -2, fade: 2 },

  // ── Westside Discs (more) ─────────────────────────────────────────────────
  { manufacturer: "Westside Discs", name: "Maiden", type: "putter", speed: 2, glide: 4, turn: -1, fade: 1 },
  { manufacturer: "Westside Discs", name: "Tournament", type: "distance_driver", speed: 11, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Westside Discs", name: "VIP Shield", type: "fairway_driver", speed: 7, glide: 5, turn: 0, fade: 3 },

  // ── Legacy Discs ──────────────────────────────────────────────────────────
  { manufacturer: "Legacy Discs", name: "Cannon", type: "distance_driver", speed: 13, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Legacy Discs", name: "Ethos", type: "putter", speed: 2, glide: 4, turn: -1, fade: 1 },
  { manufacturer: "Legacy Discs", name: "Icon", type: "midrange", speed: 5, glide: 5, turn: -1, fade: 2 },
  { manufacturer: "Legacy Discs", name: "Outlaw", type: "distance_driver", speed: 13, glide: 6, turn: -2, fade: 3 },
  { manufacturer: "Legacy Discs", name: "Protege", type: "fairway_driver", speed: 7, glide: 5, turn: -2, fade: 2 },

  // ── Elevation Disc Golf ───────────────────────────────────────────────────
  { manufacturer: "Elevation", name: "Rush", type: "fairway_driver", speed: 8, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Elevation", name: "Summit", type: "distance_driver", speed: 13, glide: 5, turn: -2, fade: 3 },

  // ── Guru Disc Golf ────────────────────────────────────────────────────────
  { manufacturer: "Guru", name: "Shaman", type: "putter", speed: 2, glide: 3, turn: 0, fade: 1 },
  { manufacturer: "Guru", name: "Oracle", type: "midrange", speed: 5, glide: 5, turn: -1, fade: 2 },

  // ── Prodiscus ─────────────────────────────────────────────────────────────
  { manufacturer: "Prodiscus", name: "Basic", type: "putter", speed: 2, glide: 3, turn: 0, fade: 1 },
  { manufacturer: "Prodiscus", name: "Minibird", type: "fairway_driver", speed: 9, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Prodiscus", name: "Superbird", type: "distance_driver", speed: 13, glide: 5, turn: -1, fade: 3 },
  { manufacturer: "Prodiscus", name: "Ultrabrid", type: "fairway_driver", speed: 8, glide: 5, turn: -1, fade: 3 },

  // ── Dino Discs ────────────────────────────────────────────────────────────
  { manufacturer: "Dino Discs", name: "Protoceratops", type: "putter", speed: 2, glide: 4, turn: -1, fade: 1 },
  { manufacturer: "Dino Discs", name: "Brachiosaurus", type: "midrange", speed: 5, glide: 5, turn: -1, fade: 2 },

  // ── Alfa Discs ────────────────────────────────────────────────────────────
  { manufacturer: "Alfa Discs", name: "Koi", type: "putter", speed: 2, glide: 4, turn: -1, fade: 1 },
  { manufacturer: "Alfa Discs", name: "Tern", type: "fairway_driver", speed: 8, glide: 5, turn: -2, fade: 2 },
  { manufacturer: "Alfa Discs", name: "Stal", type: "distance_driver", speed: 13, glide: 5, turn: -1, fade: 3 },
];

/** Return sorted matches for a search query (disc name or manufacturer). */
export function searchDiscs(query: string): DiscRecord[] {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return [];
  return DISC_DB
    .filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.manufacturer.toLowerCase().includes(q),
    )
    .sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aStarts = aName.startsWith(q) ? 0 : 1;
      const bStarts = bName.startsWith(q) ? 0 : 1;
      return aStarts - bStarts || aName.localeCompare(bName);
    })
    .slice(0, 20);
}
