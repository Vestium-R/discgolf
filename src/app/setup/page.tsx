import Link from "next/link";

export default function SetupPage() {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-2xl font-bold text-forest-800">Setup</h2>
        <p className="text-sm text-forest-600">
          How to submit a round after you finish in UDisc.
        </p>
      </header>

      {/* AFTER EVERY ROUND — same for everyone */}
      <section className="card p-5 space-y-2 border-forest-300 bg-forest-50">
        <p className="text-xs uppercase tracking-widest text-forest-700 font-semibold">After every round</p>
        <ol className="text-base text-forest-800 space-y-2 pl-5 list-decimal font-medium">
          <li>Open the round in UDisc.</li>
          <li>Tap <strong>⋮ → Share Card Cast → The Patch</strong>.</li>
          <li>Done — saves automatically.</li>
        </ol>
      </section>

      {/* ONE-TIME SETUP */}
      <h3 className="font-display text-lg font-bold text-forest-800">One-time setup</h3>

      <section className="card p-5 space-y-2">
        <h4 className="font-display font-bold text-forest-800">🤖 Android</h4>
        <ol className="text-sm text-forest-700 space-y-1 pl-5 list-decimal">
          <li>Open this site in Chrome.</li>
          <li>Tap <strong>⋮ → Install app</strong> (or <strong>Add to Home screen</strong>).</li>
          <li>The Patch now appears in UDisc&apos;s share sheet automatically.</li>
        </ol>
      </section>

      <section className="card p-5 space-y-3">
        <h4 className="font-display font-bold text-forest-800">📱 iPhone</h4>
        <p className="text-sm text-forest-700">
          iOS doesn&apos;t let websites appear in the share sheet automatically — a Shortcut bridges the gap.
        </p>
        <ol className="text-sm text-forest-700 space-y-3 pl-5 list-decimal">
          <li>Open the <strong>Shortcuts</strong> app → tap <strong>+</strong>.</li>
          <li>Tap <strong>Add Action</strong> → search <strong>Open URLs</strong>.</li>
          <li>
            In the URL field paste:
            <pre className="mt-1 bg-forest-50 rounded p-2 text-xs overflow-x-auto select-all">https://discgolf-eight.vercel.app/add?auto=1&udiscUrl=</pre>
            Then — cursor after the <code>=</code> — tap the blue <strong>Shortcut Input</strong> chip
            above the keyboard. It appears as a blue bubble. That&apos;s correct.
          </li>
          <li>Tap the settings icon (top right) → rename it <strong>The Patch</strong>.</li>
          <li>Turn on <strong>Use with Share Sheet</strong>. Leave accepted types as-is.</li>
        </ol>
      </section>

      {/* MANUAL FALLBACK */}
      <section className="card p-5 space-y-3">
        <h4 className="font-display font-bold text-forest-800">🔗 Manual — if the share sheet isn&apos;t working</h4>
        <ol className="text-sm text-forest-700 space-y-1 pl-5 list-decimal">
          <li>In UDisc, open the round → tap <strong>⋮ → Share → Copy Link</strong>.</li>
          <li>Open The Patch → tap <strong>+</strong> (or go to <Link href="/add" className="underline">Add</Link>).</li>
          <li>Paste the link in the box and it will save.</li>
        </ol>
      </section>

      <section className="card p-5 space-y-2">
        <h4 className="font-display font-bold text-forest-800">🤔 Why not auto-pull?</h4>
        <p className="text-sm text-forest-700">
          UDisc has no public API. But one share from anyone who played captures the whole
          round — so whoever finishes first covers the group.
        </p>
      </section>
    </div>
  );
}
