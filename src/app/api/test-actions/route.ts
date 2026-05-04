import { getRosterForAudit, auditUserBagDiscs } from "@/app/admin/audit-discs-action";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "roster";

  try {
    if (action === "roster") {
      console.log("[API] Testing getRosterForAudit...");
      const roster = await getRosterForAudit();
      console.log("[API] Roster result:", JSON.stringify(roster?.slice(0, 2)));
      return Response.json({
        success: true,
        action: "roster",
        count: roster?.length || 0,
        sample: roster?.slice(0, 1)
      });
    }

    if (action === "audit") {
      const userId = searchParams.get("userId");
      if (!userId) {
        return Response.json({ success: false, error: "userId required" }, { status: 400 });
      }
      console.log("[API] Testing auditUserBagDiscs for user:", userId);
      const result = await auditUserBagDiscs(userId);
      console.log("[API] Audit result:", {
        userId: result.userId,
        totalBagDiscs: result.totalBagDiscs,
        mismatches: result.mismatches.length
      });
      return Response.json({
        success: true,
        action: "audit",
        userId: result.userId,
        totalBagDiscs: result.totalBagDiscs,
        mismatchCount: result.mismatches.length
      });
    }

    return Response.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error(`[API] ${action} error:`, message);
    console.error("[API] Stack:", stack);
    return Response.json({
      success: false,
      error: message,
      action
    }, { status: 500 });
  }
}
