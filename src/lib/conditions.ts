export type ConditionRating = {
  emoji: string;
  label: string;
  className: string;
};

function tempTier(t: number): ConditionRating | null {
  if (t <= 0)              return { emoji: "🥶", label: "Freezing", className: "bg-blue-100 text-blue-900" };
  if (t >= 32)             return { emoji: "🥵", label: "Hot",      className: "bg-red-100 text-red-900" };
  if (t >= 18 && t <= 27)  return { emoji: "☀️", label: "Ideal",    className: "bg-emerald-100 text-emerald-800" };
  if (t >= 13 && t <= 30)  return { emoji: "👍", label: "Good",     className: "bg-forest-100 text-forest-800" };
  if (t >= 4  && t <= 13)  return { emoji: "🧥", label: "Cool",     className: "bg-sky-100 text-sky-900" };
  return { emoji: "😤", label: "Tough", className: "bg-red-100 text-red-900" };
}

function windTier(w: number): ConditionRating | null {
  if (w >= 40)             return { emoji: "💨", label: "Windy",    className: "bg-orange-100 text-orange-900" };
  if (w >= 20)             return { emoji: "🌬", label: "Breezy",   className: "bg-amber-100 text-amber-800" };
  if (w >= 10)             return { emoji: "🍃", label: "Light breeze", className: "bg-forest-50 text-forest-700" };
  return null;
}

/**
 * Returns both a temperature tier and (if notable) a wind tier.
 * Callers can render either one or compose them into a single badge.
 */
export function rateConditions(tempC?: number, windKph?: number): ConditionRating | null {
  const parts = rateConditionsAll(tempC, windKph);
  if (parts.length === 0) return null;
  return {
    emoji: parts.map((p) => p.emoji).join(" "),
    label: parts.map((p) => p.label).join(" · "),
    className: parts[0].className,
  };
}

export function rateConditionsAll(tempC?: number, windKph?: number): ConditionRating[] {
  const out: ConditionRating[] = [];
  if (tempC != null) {
    const t = tempTier(tempC);
    if (t) out.push(t);
  }
  if (windKph != null) {
    const w = windTier(windKph);
    if (w) out.push(w);
  }
  return out;
}

export function formatConditions(tempC?: number, windKph?: number): string {
  const parts: string[] = [];
  if (tempC != null) parts.push(`${tempC}°C`);
  if (windKph != null) parts.push(`${windKph} km/h wind`);
  return parts.join(" · ");
}
