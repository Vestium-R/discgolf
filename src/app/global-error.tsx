"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ fontFamily: "sans-serif", padding: 24 }}>
        <h2>App crashed</h2>
        <pre style={{ whiteSpace: "pre-wrap", color: "#7a1313" }}>
          {error.message}
          {error.digest ? `\n(digest: ${error.digest})` : ""}
        </pre>
        <button onClick={reset}>Retry</button>
      </body>
    </html>
  );
}
