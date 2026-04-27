import Link from "next/link";

export default function SetupPage() {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-2xl font-bold text-forest-800">One-tap sharing</h2>
        <p className="text-sm text-forest-600">
          Finish a round in UDisc, share it to The Patch. No retyping, no pasting.
        </p>
      </header>

      {/* THE ACTUAL FLOW (what you do every round) */}
      <section className="card p-5 space-y-3 border-forest-300 bg-forest-50">
        <div className="text-xs uppercase tracking-widest text-forest-700 font-semibold">
          After every round
        </div>
        <ol className="text-base text-forest-800 space-y-3 pl-6 list-decimal font-medium">
          <li>Open the round in UDisc.</li>
          <li>Tap the three dots <span className="inline-block px-1.5 py-0.5 border border-forest-300 rounded text-xs font-mono">⋮</span></li>
          <li>Tap <strong>Share Card Cast</strong> → pick <strong>The Patch</strong>.</li>
        </ol>
        <p className="text-sm text-forest-700 pt-1">
          That&apos;s it. The site auto-detects everyone who played, adds the round, moves the patch if it should,
          and updates the standings.
        </p>
      </section>

      {/* ONE-TIME SETUP */}
      <div>
        <h3 className="font-display text-lg font-bold text-forest-800 mb-2">One-time setup</h3>
        <p className="text-sm text-forest-600 mb-4">
          Before step 3 works, you need to teach your phone that &quot;The Patch&quot; is a share target. Pick your phone below.
        </p>
      </div>

      <section className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-forest-800">🤖 Android — install as app (30 seconds)</h3>
        <ol className="text-sm text-forest-700 space-y-2 pl-5 list-decimal">
          <li>In Chrome, open <Link href="/" className="underline">this site</Link>.</li>
          <li>Tap the menu ⋮ → <strong>Install app</strong> (or <strong>Add to Home screen</strong>).</li>
          <li>Done. The Patch now shows up in UDisc&apos;s Card Cast share sheet.</li>
        </ol>
      </section>

      <section className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-forest-800">📱 iPhone — one-time Shortcut (1 minute)</h3>
        <p className="text-sm text-forest-700">
          iOS doesn&apos;t let websites register as share targets directly. A Shortcut bridges the gap.
        </p>
        <ol className="text-sm text-forest-700 space-y-2 pl-5 list-decimal">
          <li>Open the <strong>Shortcuts</strong> app.</li>
          <li>Tap <strong>+</strong> to create a new shortcut.</li>
          <li>Tap <strong>Add Action</strong> → search <strong>Open URLs</strong>.</li>
          <li>
            In the URL field, paste this — <strong>stop before the brackets</strong>:
            <pre className="mt-1 bg-forest-50 rounded p-2 text-xs overflow-x-auto select-all">https://discgolf-eight.vercel.app/add?auto=1&udiscUrl=</pre>
            Then — <em>do not type the brackets</em> — tap the blue <strong>Shortcut Input</strong> token
            that appears in the row above the keyboard. It inserts as a blue bubble after the = sign.
            That&apos;s the right look.
          </li>
          <li>Tap the shortcut&apos;s settings icon (top right) → rename it <strong>The Patch</strong>.</li>
          <li>
            At the top of your shortcut you&apos;ll see a block that says{" "}
            <strong>&ldquo;Receive [something] from Share Sheet&rdquo;</strong>.{" "}
            Leave it accepting <strong>multiple types</strong> (the default &ldquo;Apps and 18 more&rdquo; is fine) —
            UDisc shares as text, so restricting to URLs only will hide The Patch from the share sheet.
            The site automatically extracts the scorecard link from whatever UDisc sends.
          </li>
          <li>
            Done. Now in UDisc: ⋮ → Share Card Cast → <strong>The Patch</strong> → saved.
          </li>
        </ol>
      </section>

      <section className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-forest-800">🤔 Why not auto-pull from UDisc?</h3>
        <p className="text-sm text-forest-700">
          UDisc doesn&apos;t expose user profiles or a public API. But one share from anyone who played captures the
          whole round — so whoever finishes and shares is covering the whole group.
        </p>
      </section>

      <section className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-forest-800">Fallback</h3>
        <p className="text-sm text-forest-700">
          No setup, any phone: bookmark <Link href="/add" className="underline"><code>/add</code></Link> on your home screen.
          From UDisc, Copy Link → open bookmark → paste → tap Save.
        </p>
      </section>
    </div>
  );
}
