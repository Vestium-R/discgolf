import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options?: Parameters<Awaited<ReturnType<typeof cookies>>["set"]>[2] };

/**
 * Session-aware client used for reading auth state. Uses the anon key
 * and the user's cookies so `auth.getUser()` returns the signed-in user.
 */
export async function supabaseSession() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (all: CookieToSet[]) => {
          try {
            for (const c of all) cookieStore.set(c.name, c.value, c.options);
          } catch {
            /* server component — Next blocks cookie writes outside actions/route handlers */
          }
        },
      },
    }
  );
}

/**
 * Admin client using the service role key. Bypasses RLS.
 * Only call from server code after verifying the caller is authorized.
 */
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
