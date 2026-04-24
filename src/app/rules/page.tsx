import { BadgeCrown } from "@/components/BadgeCrown";

export default function RulesPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <BadgeCrown size="lg" />
        <div>
          <h2 className="font-display text-2xl font-bold text-forest-800">The Traveling Patch</h2>
          <p className="text-sm text-forest-600">One badge. One season. One holder at a time.</p>
        </div>
      </header>

      <section className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-forest-800">The idea</h3>
        <p className="text-sm text-forest-700">
          There is <strong>one patch</strong>. It travels from player to player all season.
          At season end the wins leader adds their year to it — same patch, new stripe.
        </p>
      </section>

      <section className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-forest-800">🧥 How the patch moves</h3>
        <ul className="text-sm text-forest-700 space-y-2 pl-4 list-disc">
          <li>Every season starts with an assigned holder (previous champion, random pick, whatever the group agrees on).</li>
          <li>
            The patch only changes hands when the <strong>current holder plays a round and someone else wins</strong>.
            That winner takes the patch. 🗡
          </li>
          <li>
            If the holder plays and wins, they <strong>defend</strong>. 🛡
          </li>
          <li>
            If the holder <strong>doesn&apos;t play</strong> that round, the patch stays with them.
            The round still counts — points and wins are awarded — but the badge doesn&apos;t move. 💤
          </li>
          <li>
            2+ members playing = a round that counts.
          </li>
        </ul>
      </section>

      <section className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-forest-800">⚖️ Forfeit</h3>
        <p className="text-sm text-forest-700">
          If a holder stops playing regularly, the group can forfeit the patch. No drama — the
          admin re-assigns the initial holder for the rest of the season, and it goes back into active play.
        </p>
      </section>

      <section className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-forest-800">🏆 Season champion — keeps the patch forever</h3>
        <ul className="text-sm text-forest-700 space-y-2 pl-4 list-disc">
          <li><strong>Most wins at year end keeps the patch permanently.</strong></li>
          <li>They add the year to it. Same patch, with their year on it.</li>
          <li>Whoever is holding the patch on the last day of the season is <em>not</em> automatically the champion — only total wins decide.</li>
          <li>Eternal bragging rights.</li>
        </ul>
      </section>

      <section className="card p-5 space-y-4">
        <h3 className="font-display font-bold text-forest-800">📊 Scoring</h3>

        <div className="space-y-2">
          <h4 className="font-semibold text-forest-800">Wins come first</h4>
          <p className="text-sm text-forest-700">
            Standings are sorted by <strong>total wins</strong>. Finish 1st in a round → 1 win. That&apos;s all that matters at year end —
            the player with the most wins keeps the patch.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-forest-800">Points are the tiebreaker</h4>
          <p className="text-sm text-forest-700">
            When two players have the same number of wins, <strong>points</strong> decide who&apos;s ahead. Points reward good finishes
            even when you don&apos;t win.
          </p>
          <p className="text-sm text-forest-700">
            The formula is <strong className="font-mono">N − position + 1</strong>, where <strong>N</strong> is how many players
            were in that round:
          </p>
          <div className="overflow-x-auto">
            <table className="text-sm border border-forest-200 rounded w-full">
              <thead className="bg-forest-50 text-forest-700">
                <tr>
                  <th className="py-1.5 px-3 text-left">Players (N)</th>
                  <th className="py-1.5 px-3 text-right">1st</th>
                  <th className="py-1.5 px-3 text-right">2nd</th>
                  <th className="py-1.5 px-3 text-right">3rd</th>
                  <th className="py-1.5 px-3 text-right">4th</th>
                  <th className="py-1.5 px-3 text-right">5th</th>
                </tr>
              </thead>
              <tbody className="text-forest-800 tabular-nums">
                <tr className="border-t border-forest-100"><td className="py-1.5 px-3">2</td><td className="py-1.5 px-3 text-right font-semibold">2</td><td className="py-1.5 px-3 text-right">1</td><td /><td /><td /></tr>
                <tr className="border-t border-forest-100"><td className="py-1.5 px-3">3</td><td className="py-1.5 px-3 text-right font-semibold">3</td><td className="py-1.5 px-3 text-right">2</td><td className="py-1.5 px-3 text-right">1</td><td /><td /></tr>
                <tr className="border-t border-forest-100"><td className="py-1.5 px-3">4</td><td className="py-1.5 px-3 text-right font-semibold">4</td><td className="py-1.5 px-3 text-right">3</td><td className="py-1.5 px-3 text-right">2</td><td className="py-1.5 px-3 text-right">1</td><td /></tr>
                <tr className="border-t border-forest-100"><td className="py-1.5 px-3">5</td><td className="py-1.5 px-3 text-right font-semibold">5</td><td className="py-1.5 px-3 text-right">4</td><td className="py-1.5 px-3 text-right">3</td><td className="py-1.5 px-3 text-right">2</td><td className="py-1.5 px-3 text-right">1</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-forest-600">
            Winning a 5-player round is worth more points than winning a 2-player round — it&apos;s a tougher field.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-forest-800">Ties</h4>
          <p className="text-sm text-forest-700">
            If two players tie for 1st, <strong>both get a win</strong> and they split the combined points for the positions
            they cover. Example: tied 1st in a 5-player round = (5 + 4) / 2 = <strong>4.5 points each</strong>.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold text-forest-800">Non-players</h4>
          <p className="text-sm text-forest-700">
            If you didn&apos;t play, you don&apos;t earn points or a win for that round. The round still happens, the patch can
            still move (if the current holder was there), and everyone who played racks up.
          </p>
        </div>
      </section>

      <section className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-forest-800">🥏 Adding rounds</h3>
        <ul className="text-sm text-forest-700 space-y-2 pl-4 list-disc">
          <li>Anyone can add a round — no sign-in.</li>
          <li>One UDisc scorecard paste captures everyone who played.</li>
          <li>See <a href="/setup" className="underline">Setup</a> for one-tap sharing from UDisc&apos;s share sheet.</li>
          <li>Same scorecard can&apos;t be double-counted; we dedupe on UDisc&apos;s ID.</li>
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
