export function BadgeCrown({
  size = "md",
  glow = false,
  imageUrl,
}: {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  glow?: boolean;
  imageUrl?: string | null;
}) {
  const dims =
    size === "xl"
      ? "w-28 h-28 text-3xl"
      : size === "lg"
        ? "w-16 h-16 text-xl"
        : size === "md"
          ? "w-10 h-10 text-sm"
          : size === "sm"
            ? "w-7 h-7 text-xs"
            : "w-5 h-5 text-[10px]";

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt="Badge"
        className={`${dims} rounded-full object-cover shadow-lg ring-2 ring-white/40 ${glow ? "badge-crown-glow" : ""}`}
      />
    );
  }
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
