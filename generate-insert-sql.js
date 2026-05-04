#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Read CSV
const csvPath = path.join(process.env.HOME || process.env.USERPROFILE, "Downloads", "disc_golf_complete_with_plastics.csv");
const csvContent = fs.readFileSync(csvPath, "utf-8");
const lines = csvContent.split("\n").slice(1);

// Read existing database
const dbPath = path.join(__dirname, "src/lib/discs-db.ts");
const dbContent = fs.readFileSync(dbPath, "utf-8");

// Parse CSV
const csvDiscs = [];
for (const line of lines) {
  if (!line.trim()) continue;
  const parts = line.split(",");
  const manufacturer = parts[0]?.trim();
  const name = parts[1]?.trim();
  const speed = parts[2]?.trim();
  const glide = parts[3]?.trim();
  const turn = parts[4]?.trim();
  const fade = parts[5]?.trim();

  if (!manufacturer || !name || !speed || !glide || !turn || !fade) continue;

  csvDiscs.push({
    manufacturer,
    name,
    speed: parseFloat(speed),
    glide: parseFloat(glide),
    turn: parseFloat(turn),
    fade: parseFloat(fade),
  });
}

// Find new discs
const newDiscs = [];
for (const disc of csvDiscs) {
  const escapedMfg = disc.manufacturer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedName = disc.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `manufacturer:\\s*"${escapedMfg}"\\s*,\\s*name:\\s*"${escapedName}"`,
    "i"
  );

  if (!pattern.test(dbContent)) {
    newDiscs.push(disc);
  }
}

// Generate TypeScript array format for discs-db.ts
const entries = newDiscs.map(d => {
  const name = d.name.replace(/"/g, '\\"');
  const mfg = d.manufacturer.replace(/"/g, '\\"');
  return `  { manufacturer: "${mfg}", name: "${name}", type: "unknown", speed: ${d.speed}, glide: ${d.glide}, turn: ${d.turn}, fade: ${d.fade} },`;
});

const sql = entries.join("\n");

fs.writeFileSync(path.join(__dirname, "new-discs-to-add.txt"), sql);

console.log(`Generated entries for ${newDiscs.length} new discs`);
console.log(`Saved to: new-discs-to-add.txt`);
console.log(`\nFirst 5 entries:`);
console.log(entries.slice(0, 5).join("\n"));
