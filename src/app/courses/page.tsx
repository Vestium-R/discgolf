import Link from "next/link";
import { getRoster, getRounds, getSettings } from "@/lib/store";
import { prettyDate } from "@/lib/format";
import { parseUdiscUrl } from "@/lib/udisc";
import { Avatar } from "@/components/Avatar";
import { BadgeCrown } from "@/components/BadgeCrown";
import type { PlayerId } from "@/lib/id-validation";

type LayoutStats = {
  name: string; // the layout label (e.g. "The Demon Layout"), or "Default" if course has no layout suffix
  fullName: string; // "Course — Layout" as stored on the round
  rounds: number;
  winners: Map<PlayerId, number>;
  mostRecent: { date: string; roundId: string; winnerId: PlayerId } | null;
};

type CourseGroup = {
  name: string; // base course name, e.g. "Dieppe DGC"
  rounds: number;
  layouts: LayoutStats[];
};

/**
 * Rounds carry a combined course identifier like "Dieppe DGC — The Demon Layout".
 * Split on the em-dash to group all layouts of a course together.
 */
function splitCourseName(full: string): { base: string; layout: string | null } {
  const idx = full.indexOf(" — ");
  if (idx < 0) return { base: full, layout: null };
  return { base: full.slice(0, idx), layout: full.slice(idx + 3) };
}

export default async function CoursesPage() {
  const [roster, rounds, settings] = await Promise.all([getRoster(), getRounds(), getSettings()]);
  const byId = new Map(roster.map((p) => [p.id, p]));
  const layouts = new Map<string, LayoutStats>();

  for (const r of rounds) {
    if (!r.courseName) continue;
    const stats = layouts.get(r.courseName) ?? {
      name: splitCourseName(r.courseName).layout ?? "Default layout",
      fullName: r.courseName,
      rounds: 0,
      winners: new Map(),
      mostRecent: null,
    };
    stats.rounds += 1;
    const winner = r.results.find((x) => x.position === 1);
    if (winner) {
      stats.winners.set(winner.playerId, (stats.winners.get(winner.playerId) ?? 0) + 1);
      if (!stats.mostRecent || r.date > stats.mostRecent.date) {
        stats.mostRecent = { date: r.date, roundId: r.id, winnerId: winner.playerId };
      }
    }
    layouts.set(r.courseName, stats);
  }

  const courses = new Map<string, CourseGroup>();
  for (const l of layouts.values()) {
    const { base } = splitCourseName(l.fullName);
    const g = courses.get(base) ?? { name: base, rounds: 0, layouts: [] };
    g.rounds += l.rounds;
    g.layouts.push(l);
    courses.set(base, g);
  }
  for (const g of courses.values()) g.layouts.sort((a, b) => b.rounds - a.rounds);
  const courseList = [...courses.values()].sort((a, b) => b.rounds - a.rounds);

  // Resolve UDisc course-map link per course by re-parsing any round's
  // udiscUrl. parseUdiscUrl hits Next's fetch cache so repeat views don't
  // spam UDisc. Silently omit if no rounds have URLs or parse fails.
  const mapUrlByCourse = new Map<string, string>();
  await Promise.all(
    courseList.map(async (c) => {
      const sample = rounds.find((r) => r.courseName && splitCourseName(r.courseName).base === c.name && r.udiscUrl);
      if (!sample?.udiscUrl) return;
      const parsed = await parseUdiscUrl(sample.udiscUrl);
      if (parsed.ok && parsed.courseMapUrl) mapUrlByCourse.set(c.name, parsed.courseMapUrl);
    }),
  );

  return (
    <div className="space-y-5">
      <header>
        <h2 className="font-display text-2xl font-bold text-forest-800">Courses</h2>
        <p className="text-sm text-forest-600">
          Where the badge changes hands. Most rounds played, top winners per layout.
        </p>
      </header>

      {courseList.length === 0 && (
        <div className="card p-6 text-center">
          <p className="text-forest-600">No rounds have a course name yet.</p>
        </div>
      )}

      <div className="space-y-5">
        {courseList.map((c) => (
          <section key={c.name} className="space-y-2">
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <div className="flex items-baseline gap-3 flex-wrap">
                <h3 className="font-display text-xl font-bold text-forest-800">{c.name}</h3>
                {mapUrlByCourse.get(c.name) && (
                  <a
                    href={mapUrlByCourse.get(c.name)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-full bg-forest-700 text-white px-3 py-1 text-xs font-semibold hover:bg-forest-600 transition"
                  >
                    🗺️ Course map ↗
                  </a>
                )}
              </div>
              <span className="text-xs text-forest-600">
                {c.rounds} round{c.rounds === 1 ? "" : "s"} · {c.layouts.length} layout{c.layouts.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {c.layouts.map((l) => {
                const topWinner = [...l.winners.entries()].sort((a, b) => b[1] - a[1])[0];
                const top = topWinner ? byId.get(topWinner[0]) : null;
                const recent = l.mostRecent ? byId.get(l.mostRecent.winnerId) : null;
                const filterHref = `/seasons/${settings.currentSeason}?layout=${encodeURIComponent(l.fullName)}`;
                return (
                  <div key={l.fullName} className="card p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="font-semibold text-forest-800">{l.name}</div>
                      <span className="text-xs text-forest-600">{l.rounds} round{l.rounds === 1 ? "" : "s"}</span>
                    </div>
                    {top && (
                      <div className="flex items-center gap-2 mb-2">
                        <BadgeCrown size="xs" />
                        <Avatar playerId={top.id} name={top.name} size="sm" imageUrl={top.udiscAvatarUrl} />
                        <span className="text-sm">
                          <Link href={`/players/${top.id}`} className="font-semibold text-forest-800 hover:underline">
                            {top.name}
                          </Link>
                          <span className="text-forest-600"> · {topWinner![1]} win{topWinner![1] === 1 ? "" : "s"}</span>
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      {l.mostRecent && recent ? (
                        <Link href={`/rounds/${l.mostRecent.roundId}`} className="text-forest-600 hover:underline truncate">
                          Last: {prettyDate(l.mostRecent.date)} — {recent.name} won
                        </Link>
                      ) : <span />}
                      <Link
                        href={filterHref}
                        className="inline-flex items-center gap-1 rounded-full bg-forest-700 text-white px-2 py-0.5 font-semibold hover:bg-forest-600 whitespace-nowrap"
                      >
                        Standings →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
