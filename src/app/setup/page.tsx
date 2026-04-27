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

      {/* ANDROID */}
      <section className="card p-5 space-y-4">
        <h3 className="font-display font-bold text-forest-800">🤖 Android</h3>

        <div>
          <p className="text-xs uppercase tracking-widest text-forest-600 font-semibold mb-1">One-time setup</p>
          <ol className="text-sm text-forest-700 space-y-1 pl-5 list-decimal">
            <li>Open this site in Chrome.</li>
            <li>Tap <strong>⋮ → Install app</strong> (or <strong>Add to Home screen</strong>).</li>
          </ol>
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest text-forest-600 font-semibold mb-1">After every round</p>
          <ol className="text-sm text-forest-700 space-y-1 pl-5 list-decimal">
            <li>Open the round in UDisc.</li>
            <li>Tap <strong>⋮ → Share Card Cast → The Patch</strong>.</li>
            <li>Done — saves automatically.</li>
          </ol>
        </div>
      </section>

      {/* IPHONE */}
      <section className="card p-5 space-y-4">
        <h3 className="font-display font-bold text-forest-800">📱 iPhone</h3>
        <p className="text-sm text-forest-700">
          Card Cast on iPhone sends a screenshot image instead of a link, so it doesn&apos;t work.
          Use <strong>Copy Link</strong> instead — set up the shortcut below to make it one tap.
        </p>

        <div>
          <p className="text-xs uppercase tracking-widest text-forest-600 font-semibold mb-1">One-time shortcut setup</p>
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
        </div>

        <div>
          <p className="text-xs uppercase tracking-widest text-forest-600 font-semibold mb-1">After every round</p>
          <ol className="text-sm text-forest-700 space-y-1 pl-5 list-decimal">
            <li>Open the round in UDisc.</li>
            <li>Tap <strong>⋮ → Share → Copy Link</strong>.</li>
            <li>In the share sheet, pick <strong>The Patch</strong>.</li>
            <li>Done — saves automatically.</li>
          </ol>
        </div>
      </section>

      <section className="card p-5 space-y-2">
        <h3 className="font-display font-bold text-forest-800">🤔 Why not auto-pull?</h3>
        <p className="text-sm text-forest-700">
          UDisc has no public API. But one link share from anyone who played captures the whole
          round — so whoever finishes first covers the group.
        </p>
      </section>
    </div>
  );
}
