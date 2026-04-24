import Link from "next/link";

export default function SetupPage() {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-2xl font-bold text-forest-800">One-tap sharing</h2>
        <p className="text-sm text-forest-600">
          Set this up once and every UDisc scorecard becomes a two-tap save.
        </p>
      </header>

      <section className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-forest-800">📱 iPhone — iOS Shortcut</h3>
        <ol className="text-sm text-forest-700 space-y-2 pl-5 list-decimal">
          <li>Open the <strong>Shortcuts</strong> app.</li>
          <li>Tap <strong>+</strong> to create a new shortcut.</li>
          <li>Tap <strong>Add Action</strong> → search <strong>Open URLs</strong>.</li>
          <li>
            In the URL field paste:
            <pre className="mt-1 bg-forest-50 rounded p-2 text-xs overflow-x-auto">https://discgolf-eight.vercel.app/add?auto=1&udiscUrl=[Shortcut Input]</pre>
            (tap &quot;Shortcut Input&quot; to insert the variable where shown.)
          </li>
          <li>Tap the shortcut settings → rename it to <strong>Save to Patch</strong>.</li>
          <li>
            In settings → <strong>Use with Share Sheet</strong> → turn ON. Accept URLs only.
          </li>
          <li>
            Now after a UDisc round: ⋮ → <strong>Share cast</strong> → <strong>Save to Patch</strong> → done.
          </li>
        </ol>
      </section>

      <section className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-forest-800">🤖 Android — install the site as an app</h3>
        <ol className="text-sm text-forest-700 space-y-2 pl-5 list-decimal">
          <li>In Chrome, open <Link href="/" className="underline">this site</Link>.</li>
          <li>Tap the menu ⋮ → <strong>Install app</strong> (or &quot;Add to Home screen&quot;).</li>
          <li>
            Once installed, after a UDisc round: ⋮ → <strong>Share</strong> → <strong>The Patch</strong> → auto-saves.
          </li>
        </ol>
        <p className="text-xs text-forest-600">
          The Web Share Target API handles everything — no form, no paste. Just share.
        </p>
      </section>

      <section className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-forest-800">⚡ Home-screen shortcut (any phone)</h3>
        <p className="text-sm text-forest-700">
          Bookmark this URL on your home screen for one-tap access to the add page:
        </p>
        <pre className="bg-forest-50 rounded p-2 text-xs overflow-x-auto">
          https://discgolf-eight.vercel.app/add
        </pre>
      </section>

      <section className="card p-5 space-y-3">
        <h3 className="font-display font-bold text-forest-800">🤔 Why can&apos;t it just auto-pull?</h3>
        <p className="text-sm text-forest-700">
          UDisc doesn&apos;t publish user profiles or a public API. Scorecards are public and fully parseable,
          but there&apos;s no way for the site to discover yours without someone sharing it first.
          One share captures everyone in the round, though — so whoever finishes clicks once and you&apos;re all logged.
        </p>
      </section>
    </div>
  );
}
