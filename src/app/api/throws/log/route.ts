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

    if (error) throw error;
    return NextResponse.json({ ok: true, throw: data });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
