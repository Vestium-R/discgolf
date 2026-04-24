export function BadgeCrown({
  size = "md",
  glow = false,
}: {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  glow?: boolean;
}) {
  const dims =
    size === "xl"
      ? "w-24 h-24 text-3xl"
      : size === "lg"
        ? "w-14 h-14 text-xl"
        : size === "md"
          ? "w-9 h-9 text-sm"
          : size === "sm"
            ? "w-7 h-7 text-xs"
            : "w-5 h-5 text-[10px]";
  return (
    <span
      className={`badge-crown ${glow ? "badge-crown-glow" : ""} inline-flex items-center justify-center rounded-full font-bold ${dims}`}
      aria-label="Badge"
    >
      ★
    </span>
  );
}

export function MedalBadge({ position }: { position: number }) {
  if (position > 3) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-forest-50 text-xs font-semibold text-forest-700">
        {position}
      </span>
    );
  }
  const cls = position === 1 ? "medal-1" : position === 2 ? "medal-2" : "medal-3";
  return (
    <span className={`${cls} inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow-sm`}>
      {position}
    </span>
  );
}
