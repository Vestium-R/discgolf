import { supabaseSession } from "./supabase/server";
import { asAuthUserId, type AuthUserId } from "./id-validation";

export type SessionUser = {
  id: AuthUserId;
  email: string;
};

export async function getUser(): Promise<SessionUser | null> {
  const supabase = await supabaseSession();
  const { data } = await supabase.auth.getUser();
  if (!data.user?.email) return null;
  return { id: asAuthUserId(data.user.id, "auth.getUser()"), email: data.user.email };
}

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

export async function isAdmin(): Promise<boolean> {
  const user = await getUser();
  return isAdminEmail(user?.email);
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getUser();
  if (!user) throw new Error("Sign in required");
  if (!isAdminEmail(user.email)) throw new Error("Not an admin");
  return user;
}
