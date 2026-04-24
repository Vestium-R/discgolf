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

      <section className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-forest-800">📊 Scoring</h3>
        <ul className="text-sm text-forest-700 space-y-2 pl-4 list-disc">
          <li>
            <strong>Wins</strong> are the primary standings metric.
          </li>
          <li>
            <strong>Points</strong> (N − position + 1) break ties when two players have the same win count.
          </li>
          <li>
            Tied for 1st in a round: both get a win, the win points are split.
          </li>
        </ul>
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
