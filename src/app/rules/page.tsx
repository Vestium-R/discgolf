import { BadgeCrown } from "@/components/BadgeCrown";

export default function RulesPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <BadgeCrown size="lg" />
        <div>
          <h2 className="font-display text-2xl font-bold text-forest-800">The Traveling Patch</h2>
          <p className="text-sm text-forest-600">One badge. One season. One patch holder at a time.</p>
        </div>
      </header>

      <section className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-forest-800">The idea</h3>
        <p className="text-sm text-forest-700">
          There is <strong>one patch</strong>. It travels from player to player all season. The year gets
          added to it at season end — same patch, new stripe.
        </p>
      </section>

      <section className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-forest-800">🧥 Week-to-week (the Traveling Patch)</h3>
        <ul className="text-sm text-forest-700 space-y-2 pl-4 list-disc">
          <li>A round counts any time <strong>2+ members</strong> play.</li>
          <li>Lowest score = 1 win. Winner becomes the patch holder.</li>
          <li>The patch stays with them until the next round&apos;s winner takes it.</li>
          <li>The patch is always live — there is always exactly one holder.</li>
        </ul>
      </section>

      <section className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-forest-800">🏆 Season end (same patch, new year)</h3>
        <ul className="text-sm text-forest-700 space-y-2 pl-4 list-disc">
          <li>Most wins at season end = season champion.</li>
          <li>Their year gets added to the patch.</li>
          <li>Eternal bragging rights.</li>
        </ul>
        <p className="text-sm text-forest-700">
          <strong>It&apos;s still the same patch.</strong> The champion holds it in the off-season and starts the next year with it.
        </p>
      </section>

      <section className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-forest-800">⚖️ Forfeit rule</h3>
        <p className="text-sm text-forest-700">
          If the current holder doesn&apos;t show up, they don&apos;t get to keep the patch by sitting out —
          the next round&apos;s winner simply takes it. No drama. No debate.
        </p>
      </section>

      <section className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-forest-800">⚙️ How this site implements it</h3>
        <ul className="text-sm text-forest-700 space-y-2 pl-4 list-disc">
          <li>
            <strong>Patch holder</strong> = winner of the most recent round. Updates automatically.
          </li>
          <li>
            <strong>Standings</strong> sort by <strong>wins</strong> (primary). Points (N − position + 1) break ties.
          </li>
          <li>
            Ties at #1 in a round: both players get a win, points are split.
          </li>
          <li>
            Anyone can add a round — just paste a UDisc scorecard link on the home page. No sign-in.
          </li>
          <li>
            One scorecard captures everyone who played. The site dedupes if someone pastes the same link twice.
          </li>
        </ul>
      </section>

      <section className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-forest-800">Past champions</h3>
        <ul className="text-sm text-forest-700 space-y-1 pl-4 list-disc">
          <li>2025 — Jeffrey Rijkse (Season 1)</li>
          <li>2026 — in progress</li>
        </ul>
      </section>
    </div>
  );
}
