import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const url = String(form.get("udiscUrl") ?? "").trim();
  const dest = url ? `/add?${new URLSearchParams({ udiscUrl: url, auto: "1" })}` : "/add?err=nourl";
  return NextResponse.redirect(new URL(dest, req.url), { status: 303 });
}
