"use server";

import { supabaseSession } from "@/lib/supabase/server";

export async function getDiscThrowStats(bagDiscId: string) {
  const supabase = await supabaseSession();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("disc_throws")
    .select("distance_ft")
    .eq("bag_disc_id", bagDiscId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return null;
  if (!data || data.length === 0) return null;

  const distances = data.map(d => d.distance_ft);
  const avg = Math.round(distances.reduce((a, b) => a + b, 0) / distances.length);
  const min = Math.min(...distances);
  const max = Math.max(...distances);
  const count = distances.length;

  return { avg, min, max, count };
}
