import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function GET() {
  const user = await getUser();
  if (!user) {
    redirect("/");
  }
  redirect(`/players/${user.id}`);
}
