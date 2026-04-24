import Link from "next/link";
import { getRoster, getRounds } from "@/lib/store";
import { prettyDate } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { BadgeCrown } from "@/components/BadgeCrown";

type CourseStats = {
  name: string;
  rounds: number;
  winners: Map<string, number>; // playerId -> wins at this course
  mostRecent: { date: string; roundId: string; winnerId: string } | null;
};

export default async function CoursesPage() {
  const [roster, rounds] = await Promise.all([getRoster(), getRounds()]);
  const byName = new Map(roster.map((p) => [p.id, p]));
  const courses = new Map<string, CourseStats>();

  for (const r of rounds) {
    if (!r.courseName) continue;
    const stats = courses.get(r.courseName) ?? {
      name: r.courseName,
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
    courses.set(r.courseName, stats);
  }

  const list = [...courses.values()].sort((a, b) => b.rounds - a.rounds);

  return (
    <div className="space-y-5">
      <header>
        <h2 className="font-display text-2xl font-bold text-forest-800">Courses</h2>
        <p className="text-sm text-forest-600">
          Where the badge changes hands. Most rounds played, top winners per course.
        </p>
      </header>

      {list.length === 0 && (
        <div className="card p-6 text-center">
          <p className="text-forest-600">No rounds have a course name yet.</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((c) => {
          const topWinner = [...c.winners.entries()].sort((a, b) => b[1] - a[1])[0];
          const top = topWinner ? byName.get(topWinner[0]) : null;
          const recent = c.mostRecent ? byName.get(c.mostRecent.winnerId) : null;
          return (
            <div key={c.name} className="card p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-display font-bold text-forest-800 text-lg">{c.name}</h3>
                <span className="text-xs text-forest-600">{c.rounds} round{c.rounds === 1 ? "" : "s"}</span>
              </div>
              {top && (
                <div className="flex items-center gap-2 mb-2">
                  <BadgeCrown size="xs" />
                  <Avatar playerId={top.id} name={top.name} size="sm" />
                  <span className="text-sm">
                    <Link href={`/players/${top.id}`} className="font-semibold text-forest-800 hover:underline">{top.name}</Link>
                    <span className="text-forest-600"> · {topWinner![1]} win{topWinner![1] === 1 ? "" : "s"}</span>
                  </span>
                </div>
              )}
              {c.mostRecent && recent && (
                <Link
                  href={`/rounds/${c.mostRecent.roundId}`}
                  className="text-xs text-forest-600 hover:underline"
                >
                  Last: {prettyDate(c.mostRecent.date)} — {recent.name} won →
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
