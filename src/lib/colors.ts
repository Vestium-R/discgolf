const PALETTE = [
  { bg: "#2d5a3e", fg: "#fff" }, // forest
  { bg: "#8b4513", fg: "#fff" }, // brown
  { bg: "#4a5568", fg: "#fff" }, // slate
  { bg: "#9c4221", fg: "#fff" }, // rust
  { bg: "#2c5282", fg: "#fff" }, // navy
  { bg: "#6b46c1", fg: "#fff" }, // purple
  { bg: "#b45309", fg: "#fff" }, // amber
  { bg: "#065f46", fg: "#fff" }, // emerald
  { bg: "#991b1b", fg: "#fff" }, // red
  { bg: "#1e40af", fg: "#fff" }, // blue
  { bg: "#7c2d12", fg: "#fff" }, // warm brown
  { bg: "#374151", fg: "#fff" }, // gray
];

export function colorForPlayer(playerId: string): { bg: string; fg: string } {
  let h = 0;
  for (let i = 0; i < playerId.length; i++) h = ((h << 5) - h + playerId.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
