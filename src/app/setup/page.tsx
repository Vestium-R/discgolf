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
      <section className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-forest-800">🤖 Android</h3>

        <div className="text-xs uppercase tracking-widest text-forest-600 font-semibold">One-time setup</div>
        <ol className="text-sm text-forest-700 space-y-1 pl-5 list-decimal">
          <li>In Chrome, open <Link href="/" className="underline">this site</Link>.</li>
          <li>Tap <strong>⋮ → Install app</strong> (or <strong>Add to Home screen</strong>).</li>
        </ol>

        <div className="text-xs uppercase tracking-widest text-forest-600 font-semibold pt-2">After every round</div>
        <ol className="text-sm text-forest-700 space-y-1 pl-5 list-decimal">
          <li>Open the round in UDisc.</li>
          <li>Tap <strong>⋮ → Share Card Cast → The Patch</strong>.</li>
          <li>Done — round saves automatically.</li>
        </ol>
      </section>

      {/* IPHONE */}
      <section className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-forest-800">📱 iPhone</h3>
        <p className="text-sm text-forest-700">
          If Card Cast isn&apos;t working from your shortcut, use <strong>Copy Link</strong> instead —
          it&apos;s more reliable on iPhone.
        </p>

        <div className="text-xs uppercase tracking-widest text-forest-600 font-semibold">After every round</div>
        <ol className="text-sm text-forest-700 space-y-1 pl-5 list-decimal">
          <li>Open the round in UDisc.</li>
          <li>Tap <strong>⋮ → Share → Copy Link</strong>.</li>
          <li>Open <strong>The Patch</strong> — the link pastes automatically on the Add page.</li>
        </ol>

        <div className="text-xs uppercase tracking-widest text-forest-600 font-semibold pt-2">
          One-tap shortcut (optional — saves the paste step)
        </div>
        <ol className="text-sm text-forest-700 space-y-3 pl-5 list-decimal">
          <li>Open <strong>Shortcuts</strong> → tap <strong>+</strong>.</li>
          <li>Tap <strong>Add Action</strong> → search <strong>Open URLs</strong>.</li>
          <li>
            In the URL field paste:
            <pre className="mt-1 bg-forest-50 rounded p-2 text-xs overflow-x-auto select-all">https://discgolf-eight.vercel.app/add?auto=1&udiscUrl=</pre>
            Then with your cursor after the <code>=</code>, tap the blue{" "}
            <strong>Shortcut Input</strong> token above the keyboard (blue bubble — that&apos;s correct).
          </li>
          <li>Tap settings (top right) → rename it <strong>The Patch</strong>.</li>
          <li>
            Turn on <strong>Use with Share Sheet</strong>.
            Leave accepted types as-is — restricting to URLs only will make it disappear.
          </li>
          <li>
            Now: in UDisc tap <strong>⋮ → Share → Copy Link</strong>, then pick{" "}
            <strong>The Patch</strong> from the share sheet. Saves automatically.
          </li>
        </ol>
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
