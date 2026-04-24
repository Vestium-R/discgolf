import { BadgeCrown } from "@/components/BadgeCrown";

export default function RulesPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <BadgeCrown size="lg" />
        <div>
          <h2 className="font-display text-2xl font-bold text-forest-800">How The Badge works</h2>
          <p className="text-sm text-forest-600">The rules, in plain English.</p>
        </div>
      </header>

      <section className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-forest-800">Two trophies, not one</h3>
        <p className="text-sm text-forest-700">
          Every season has <strong>two</strong> things to win:
        </p>
        <ul className="text-sm text-forest-700 space-y-2 pl-4 list-disc">
          <li>
            <strong>The Badge</strong> — a physical/visual trophy that passes round by round. You only lose it if you play AND someone beats you.
          </li>
          <li>
            <strong>Season standings #1</strong> — at the end of the season, whoever has the most points becomes the season champion, regardless of who had the badge.
          </li>
        </ul>
      </section>

      <section className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-forest-800">Badge rules</h3>
        <ul className="text-sm text-forest-700 space-y-2 pl-4 list-disc">
          <li>The season starts with an assigned holder (random, past champ, or whoever admin picks).</li>
          <li>When they play a round and someone else wins → badge transfers to the new winner.</li>
          <li>When they play and <em>win</em> → they defend it. 🛡</li>
          <li>When they <em>don&apos;t play</em> → they keep it. The round happens, points are still awarded, but the badge doesn&apos;t move. 💤</li>
          <li>The badge can only be taken by someone at the round.</li>
        </ul>
      </section>

      <section className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-forest-800">Scoring</h3>
        <p className="text-sm text-forest-700">
          Every round awards points to each player who played:
        </p>
        <p className="text-sm text-forest-700">
          <strong>Points = N − position + 1</strong>, where N is the number of players in the round.
        </p>
        <ul className="text-sm text-forest-700 space-y-1 pl-4 list-disc">
          <li>2 players: 1st = 2 pts, 2nd = 1 pt</li>
          <li>3 players: 1st = 3, 2nd = 2, 3rd = 1</li>
          <li>5 players: 1st = 5, 2nd = 4, 3rd = 3, 4th = 2, 5th = 1</li>
        </ul>
        <p className="text-sm text-forest-700">
          Ties share the points. Tied for 1st in a 5-player round = (5 + 4) / 2 = 4.5 each.
        </p>
      </section>

      <section className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-forest-800">Adding rounds</h3>
        <ul className="text-sm text-forest-700 space-y-2 pl-4 list-disc">
          <li>Anyone in the group can add a round — no sign-in.</li>
          <li>After a UDisc round, tap the scorecard&apos;s Share button → Copy link → come here, tap Add → paste → save.</li>
          <li>One paste captures everyone who played. If you&apos;re not in the round, the person posting it still gets credit for you all.</li>
          <li>The same scorecard can&apos;t be double-counted — we dedupe on UDisc&apos;s ID.</li>
        </ul>
      </section>
    </div>
  );
}
