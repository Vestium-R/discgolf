import { supabaseSession } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseSession();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { bagDiscId, distanceFt, windMph, windDirection, courseName, holeNumber, notes } = await req.json();

    if (!bagDiscId || !distanceFt || distanceFt < 50 || distanceFt > 600) {
      return NextResponse.json({ error: "Invalid throw data" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("disc_throws")
      .insert({
        user_id: user.id,
        bag_disc_id: bagDiscId,
        distance_ft: distanceFt,
        wind_mph: windMph ?? null,
        wind_direction: windDirection ?? null,
        course_name: courseName ?? null,
        hole_number: holeNumber ?? null,
        notes: notes ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      throw new Error(`Database error: ${error.message}`);
    }
    return NextResponse.json({ ok: true, throw: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Throw log error:", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
