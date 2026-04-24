"use client";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-red-300 bg-red-50 p-5 mt-6">
      <h2 className="text-lg font-semibold text-red-900">Something went wrong</h2>
      <pre className="mt-2 whitespace-pre-wrap text-sm text-red-900">
        {error.message}
        {error.digest ? `\n(digest: ${error.digest})` : ""}
      </pre>
      <p className="mt-3 text-sm text-red-900">
        Common fixes: check that all 4 env vars are set in Vercel, and that the Supabase tables were created
        (<code>001_init.sql</code> + <code>002_seed.sql</code>).
      </p>
      <button
        onClick={reset}
        className="mt-3 rounded-lg bg-red-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-800"
      >
        Retry
      </button>
    </div>
  );
}
