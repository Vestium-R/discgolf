import { getUser } from "@/lib/auth";
import { getUserThrows } from "@/lib/store";
import { SignInForm } from "@/components/SignInForm";
import { ThrowsClient } from "@/components/ThrowsClient";

export const dynamic = "force-dynamic";

export default async function MyThrowsPage({
  searchParams,
}: {
  searchParams: Promise<{
    discId?: string;
    minDist?: string;
    maxDist?: string;
    course?: string;
  }>;
}) {
  const user = await getUser();

  if (!user) {
    return (
      <div className="space-y-6 max-w-sm mx-auto pt-6">
        <header>
          <h2 className="font-display text-2xl font-bold text-forest-800">My Throws</h2>
          <p className="text-sm text-forest-600 mt-1">Sign in to view your throw history.</p>
        </header>
        <div className="card p-5">
          <p className="text-sm font-semibold text-forest-800 mb-3">Sign in with your email</p>
          <SignInForm redirectAfter="/my-throws" />
        </div>
      </div>
    );
  }

  const params = await searchParams;
  const throws = await getUserThrows(user.id, {
    bagDiscId: params.discId,
    minDistanceFt: params.minDist ? Number(params.minDist) : undefined,
    maxDistanceFt: params.maxDist ? Number(params.maxDist) : undefined,
    courseName: params.course,
  });

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-2xl font-bold text-forest-800">My Throws</h2>
        <p className="text-sm text-forest-600">{throws.length} throw{throws.length !== 1 ? "s" : ""}</p>
      </header>

      <ThrowsClient initialThrows={throws} userId={user.id} />
    </div>
  );
}
