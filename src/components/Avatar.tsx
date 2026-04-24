import { colorForPlayer, initials } from "@/lib/colors";

export function Avatar({
  playerId,
  name,
  size = "md",
  imageUrl,
}: {
  playerId: string;
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  imageUrl?: string;
}) {
  const { bg, fg } = colorForPlayer(playerId);
  const dims =
    size === "lg"
      ? "w-12 h-12 text-sm"
      : size === "md"
        ? "w-9 h-9 text-xs"
        : size === "sm"
          ? "w-7 h-7 text-[10px]"
          : "w-5 h-5 text-[9px]";
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        className={`${dims} inline-block rounded-full object-cover shadow-inner`}
      />
    );
  }
  return (
    <span
      className={`${dims} inline-flex items-center justify-center rounded-full font-bold shadow-inner`}
      style={{ background: bg, color: fg }}
    >
      {initials(name)}
    </span>
  );
}
