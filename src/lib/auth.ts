import { cookies } from "next/headers";

const COOKIE = "kdg_admin";

export async function isAdmin(): Promise<boolean> {
  const c = await cookies();
  const tok = c.get(COOKIE)?.value;
  return !!tok && tok === expectedToken();
}

export function expectedToken(): string {
  const pw = process.env.ADMIN_PASSWORD ?? "change-me";
  return Buffer.from(`admin:${pw}`).toString("base64url");
}

export async function signInAdmin(password: string): Promise<boolean> {
  const expect = process.env.ADMIN_PASSWORD ?? "change-me";
  if (password !== expect) return false;
  const c = await cookies();
  c.set(COOKIE, expectedToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return true;
}

export async function signOutAdmin(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE);
}
