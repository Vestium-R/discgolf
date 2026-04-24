export type ConditionRating = {
  emoji: string;
  label: string;
  className: string;
};

/**
 * Rate weather for disc golf. Temp in °C, wind in mph.
 *   Ideal:  18–27°C, wind ≤ 8 mph
 *   Good:   13–29°C, wind ≤ 12 mph
 *   Breezy: 10–32°C, wind ≤ 18 mph
 *   Windy:  wind ≥ 22 mph
 *   Cold:   ≤ 4°C
 *   Hot:    ≥ 32°C
 *   Else:   "Tough"
 */
export function rateConditions(tempC?: number, windMph?: number): ConditionRating | null {
  if (tempC == null && windMph == null) return null;
  const t = tempC ?? 18;
  const w = windMph ?? 0;
  if (t >= 18 && t <= 27 && w <= 8) return { emoji: "☀️", label: "Ideal", className: "bg-emerald-100 text-emerald-800" };
  if (t >= 13 && t <= 29 && w <= 12) return { emoji: "👍", label: "Good", className: "bg-forest-100 text-forest-800" };
  if (t >= 10 && t <= 32 && w <= 18) return { emoji: "🌬", label: "Breezy", className: "bg-amber-100 text-amber-800" };
  if (w >= 22) return { emoji: "💨", label: "Windy", className: "bg-orange-100 text-orange-900" };
  if (t <= 4) return { emoji: "🥶", label: "Cold", className: "bg-blue-100 text-blue-900" };
  if (t >= 32) return { emoji: "🥵", label: "Hot", className: "bg-red-100 text-red-900" };
  return { emoji: "😤", label: "Tough", className: "bg-red-100 text-red-900" };
}

export function formatConditions(tempC?: number, windMph?: number): string {
  const parts: string[] = [];
  if (tempC != null) {
    const f = Math.round((tempC * 9) / 5 + 32);
    parts.push(`${tempC}°C / ${f}°F`);
  }
  if (windMph != null) parts.push(`${windMph} mph wind`);
  return parts.join(" · ");
}

export function fToC(f: number): number {
  return Math.round(((f - 32) * 5) / 9 * 10) / 10;
}

export function cToF(c: number): number {
  return Math.round(((c * 9) / 5 + 32));
}
