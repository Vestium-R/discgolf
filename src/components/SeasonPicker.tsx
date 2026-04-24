import Link from "next/link";

export function SeasonPicker({
  seasons,
  active,
  base = "/seasons",
}: {
  seasons: number[];
  active: number;
  base?: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {seasons.map((s) => {
        const on = s === active;
        return (
          <Link
            key={s}
            href={s === seasons[0] && base === "/seasons" ? "/" : `${base}/${s}`}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              on
                ? "bg-forest-700 text-white"
                : "border border-forest-200 bg-white text-forest-700 hover:bg-forest-50"
            }`}
          >
            {s}
          </Link>
        );
      })}
    </div>
  );
}
