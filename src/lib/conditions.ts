export type ConditionRating = {
  emoji: string;
  label: string;
  className: string;
};

export function rateConditions(tempF?: number, windMph?: number): ConditionRating | null {
  if (tempF == null && windMph == null) return null;
  const t = tempF ?? 65;
  const w = windMph ?? 0;
  if (t >= 65 && t <= 80 && w <= 5) return { emoji: "☀️", label: "Ideal", className: "bg-emerald-100 text-emerald-800" };
  if (t >= 55 && t <= 85 && w <= 10) return { emoji: "👍", label: "Good", className: "bg-forest-100 text-forest-800" };
  if (t >= 40 && t <= 90 && w <= 18) return { emoji: "🌬", label: "Breezy / cool", className: "bg-amber-100 text-amber-800" };
  if (w >= 25) return { emoji: "💨", label: "Windy", className: "bg-orange-100 text-orange-900" };
  if (t <= 35) return { emoji: "🥶", label: "Cold", className: "bg-blue-100 text-blue-900" };
  if (t >= 90) return { emoji: "🥵", label: "Hot", className: "bg-red-100 text-red-900" };
  return { emoji: "😤", label: "Tough", className: "bg-red-100 text-red-900" };
}

export function formatConditions(tempF?: number, windMph?: number): string {
  const parts: string[] = [];
  if (tempF != null) parts.push(`${tempF}°F`);
  if (windMph != null) parts.push(`${windMph} mph`);
  return parts.join(" · ");
}
