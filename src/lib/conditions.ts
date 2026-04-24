export type ConditionRating = {
  emoji: string;
  label: string;
  className: string;
};

// Evaluated in order — first match wins.
export function rateConditions(tempC?: number, windKph?: number): ConditionRating | null {
  if (tempC == null && windKph == null) return null;
  const t = tempC ?? 18;
  const w = windKph ?? 0;
  if (w >= 40)              return { emoji: "💨", label: "Windy",    className: "bg-orange-100 text-orange-900" };
  if (t <= 0)               return { emoji: "🥶", label: "Freezing", className: "bg-blue-100 text-blue-900" };
  if (t >= 32)              return { emoji: "🥵", label: "Hot",      className: "bg-red-100 text-red-900" };
  if (t >= 18 && t <= 27 && w <= 13) return { emoji: "☀️", label: "Ideal",  className: "bg-emerald-100 text-emerald-800" };
  if (t >= 13 && t <= 30 && w <= 19) return { emoji: "👍", label: "Good",   className: "bg-forest-100 text-forest-800" };
  if (t >= 4  && t <= 13 && w <= 19) return { emoji: "🧥", label: "Cool",   className: "bg-sky-100 text-sky-900" };
  if (w >= 20 && w <= 39)            return { emoji: "🌬", label: "Breezy", className: "bg-amber-100 text-amber-800" };
  return { emoji: "😤", label: "Tough", className: "bg-red-100 text-red-900" };
}

export function formatConditions(tempC?: number, windKph?: number): string {
  const parts: string[] = [];
  if (tempC != null) parts.push(`${tempC}°C`);
  if (windKph != null) parts.push(`${windKph} km/h wind`);
  return parts.join(" · ");
}
