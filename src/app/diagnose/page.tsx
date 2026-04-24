import { supabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Check = { label: string; ok: boolean; detail: string };

async function runChecks(): Promise<Check[]> {
  const checks: Check[] = [];

  const envs: Record<string, string | undefined> = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
  };
  for (const [k, v] of Object.entries(envs)) {
    if (!v) {
      checks.push({ label: k, ok: false, detail: "MISSING" });
    } else if (k === "NEXT_PUBLIC_SUPABASE_URL") {
      const looksOk = v.startsWith("https://") && v.includes(".supabase.co");
      checks.push({
        label: k,
        ok: looksOk,
        detail: looksOk ? `set (${v})` : `set but unexpected shape: ${v}`,
      });
    } else {
      checks.push({ label: k, ok: true, detail: `set (len=${v.length})` });
    }
  }

  try {
    const sb = supabaseAdmin();
    for (const table of ["players", "rounds", "season_history", "settings"]) {
      const { error, count } = await sb
        .from(table)
        .select("*", { count: "exact", head: true });
      checks.push({
        label: `SELECT from ${table}`,
        ok: !error,
        detail: error ? error.message : `ok (${count ?? 0} rows)`,
      });
    }
  } catch (e) {
    checks.push({
      label: "Supabase admin client",
      ok: false,
      detail: (e as Error).message,
    });
  }

  return checks;
}

export default async function DiagnosePage() {
  const checks = await runChecks();
  const allOk = checks.every((c) => c.ok);
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-forest-800">Diagnostics</h2>
      <p className={allOk ? "text-forest-700" : "text-red-800"}>
        {allOk ? "All systems go." : "Something's off — see red rows below."}
      </p>
      <table className="w-full text-sm border border-forest-100 rounded">
        <thead className="bg-forest-50 text-forest-700">
          <tr>
            <th className="py-2 px-3 text-left">Check</th>
            <th className="py-2 px-3 text-left">Status</th>
            <th className="py-2 px-3 text-left">Detail</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((c, i) => (
            <tr key={i} className="border-t border-forest-100">
              <td className="py-2 px-3 font-mono">{c.label}</td>
              <td className={`py-2 px-3 ${c.ok ? "text-forest-700" : "text-red-700"}`}>
                {c.ok ? "OK" : "FAIL"}
              </td>
              <td className="py-2 px-3 text-xs font-mono whitespace-pre-wrap break-all">
                {c.detail}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-forest-600">
        Delete <code>src/app/diagnose/page.tsx</code> later if you don&apos;t want this page public.
      </p>
    </div>
  );
}
