import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

/**
 * Refreshes Supabase session cookies so server components see fresh auth state.
 */
export async function proxy(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return res;
  try {
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (all: CookieToSet[]) => {
          for (const c of all) req.cookies.set(c.name, c.value);
          res = NextResponse.next({ request: req });
          for (const c of all) res.cookies.set(c.name, c.value, c.options);
        },
      },
    });
    await supabase.auth.getUser();
  } catch (e) {
    console.error("proxy: supabase init/getUser failed", e);
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
