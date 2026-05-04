#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Read CSV
const csvPath = path.join(process.env.HOME || process.env.USERPROFILE, "Downloads", "disc_golf_complete_with_plastics.csv");
const csvContent = fs.readFileSync(csvPath, "utf-8");
const lines = csvContent.split("\n").slice(1); // Skip header

// Read existing database
const dbPath = path.join(__dirname, "src/lib/discs-db.ts");
const dbContent = fs.readFileSync(dbPath, "utf-8");

// Parse CSV
const csvDiscs = [];
const skipped = [];

for (const line of lines) {
  if (!line.trim()) continue;

  const parts = line.split(",");
  const manufacturer = parts[0]?.trim();
  const name = parts[1]?.trim();
  const speed = parts[2]?.trim();
  const glide = parts[3]?.trim();
  const turn = parts[4]?.trim();
  const fade = parts[5]?.trim();

  // Skip if missing required fields
  if (!manufacturer || !name) {
    skipped.push({ reason: "missing name/manufacturer", line });
    continue;
  }

  // Skip if missing flight numbers
  if (!speed || !glide || !turn || !fade) {
    skipped.push({ reason: "missing flight numbers", manufacturer, name });
    continue;
  }

  csvDiscs.push({
    manufacturer,
    name,
    speed: parseFloat(speed),
    glide: parseFloat(glide),
    turn: parseFloat(turn),
    fade: parseFloat(fade),
  });
}

console.log(`\n=== CSV ANALYSIS ===`);
console.log(`Total rows in CSV: ${lines.length}`);
console.log(`Rows with complete flight numbers: ${csvDiscs.length}`);
console.log(`Rows skipped (missing data): ${skipped.length}`);

// Check for duplicates in CSV itself
const csvDupes = new Map();
const csvUnique = [];

for (const disc of csvDiscs) {
  const key = `${disc.manufacturer}|${disc.name}`.toLowerCase();
  if (csvDupes.has(key)) {
    csvDupes.get(key).push(disc);
  } else {
    csvDupes.set(key, [disc]);
    csvUnique.push(disc);
  }
}

const dupeCount = [...csvDupes.values()].filter(v => v.length > 1).length;
console.log(`Duplicates within CSV: ${dupeCount}`);

// Check against existing database
const newDiscs = [];
const duplicates = [];

for (const disc of csvUnique) {
  const escapedMfg = disc.manufacturer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedName = disc.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `manufacturer:\\s*"${escapedMfg}"\\s*,\\s*name:\\s*"${escapedName}"`,
    "i"
  );

  if (pattern.test(dbContent)) {
    duplicates.push(disc);
  } else {
    newDiscs.push(disc);
  }
}

console.log(`\n=== DATABASE COMPARISON ===`);
console.log(`Already in database: ${duplicates.length}`);
console.log(`New discs to add: ${newDiscs.length}`);

if (newDiscs.length > 0) {
  console.log(`\n=== NEW DISCS (first 20) ===`);
  newDiscs.slice(0, 20).forEach(d => {
    console.log(`  ${d.manufacturer} - ${d.name} (${d.speed}/${d.glide}/${d.turn}/${d.fade})`);
  });
  if (newDiscs.length > 20) {
    console.log(`  ... and ${newDiscs.length - 20} more`);
  }
}

console.log(`\n=== SUMMARY ===`);
console.log(`Ready to add: ${newDiscs.length} new discs`);
