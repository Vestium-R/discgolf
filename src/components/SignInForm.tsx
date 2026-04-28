"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export function SignInForm({ redirectAfter = "/admin" }: { redirectAfter?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErr("");
    const supabase = supabaseBrowser();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectAfter)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setErr(error.message);
      setStatus("error");
    } else {
      setStatus("sent");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-xl border border-forest-200 bg-forest-50 p-3 text-sm text-forest-800">
        Check <strong>{email}</strong> for a sign-in link.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <input
        type="email"
        required
        autoFocus
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-lg border border-forest-200 px-3 py-2"
      />
      {err && <p className="text-sm text-red-700">{err}</p>}
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-lg bg-forest-600 px-3 py-2 text-sm font-semibold text-white hover:bg-forest-700 disabled:opacity-50"
      >
        {status === "sending" ? "Sending..." : "Email me a sign-in link"}
      </button>
    </form>
  );
}
