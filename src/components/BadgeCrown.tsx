export function BadgeCrown({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = size === "lg" ? "w-10 h-10 text-lg" : size === "sm" ? "w-5 h-5 text-[10px]" : "w-7 h-7 text-xs";
  return (
    <span
      className={`badge-crown inline-flex items-center justify-center rounded-full font-bold ${dims}`}
      title="Currently holds the badge"
      aria-label="Badge holder"
    >
      ★
    </span>
  );
}
