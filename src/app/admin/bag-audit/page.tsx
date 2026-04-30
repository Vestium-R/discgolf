import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { DISC_DB } from "@/lib/discs-db";

export const dynamic = "force-dynamic";

type BagRow = {
  id: string;
  disc_name: string;
  manufacturer: string | null;
  type: string;
  speed: number;
  glide: number | null;
  turn: number | null;
  fade: number | null;
  plastic: string | null;
  notes: string | null;
  user_id: string;
};

export default async function BagAuditPage() {
  await requireAdmin();

  const { data, error } = await supabaseAdmin()
    .from("bag_discs")
    .select("id, disc_name, manufacturer, type, speed, glide, turn, fade, plastic, notes, user_id")
    .order("disc_name");

  if (error) return <div className="p-8 text-red-700">Error: {error.message}</div>;
  const rows = data as BagRow[];

  // Find rows with missing manufacturer or where disc isn't in our DB
  const issues = rows.map(r => {
    const inDb = DISC_DB.find(d =>
      d.name.toLowerCase() === r.disc_name.toLowerCase() &&
      (!r.manufacturer || d.manufacturer.toLowerCase() === r.manufacturer.toLowerCase())
    );
    const byName = DISC_DB.filter(d => d.name.toLowerCase() === r.disc_name.toLowerCase());
    return { r, inDb, byName };
  }).filter(({ r, inDb }) => !r.manufacturer || !inDb);

  const noMfr = rows.filter(r => !r.manufacturer);
  const notInDb = rows.filter(r => r.manufacturer && !DISC_DB.find(d =>
    d.name.toLowerCase() === r.disc_name.toLowerCase()
  ));

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-forest-800">Bag disc audit</h1>
      <p className="text-sm text-forest-600">{rows.length} total discs across all users · {noMfr.length} missing manufacturer · {notInDb.length} not in disc DB</p>

      {/* Missing manufacturer */}
      <section>
        <h2 className="font-bold text-forest-800 mb-3">Missing manufacturer ({noMfr.length})</h2>
        <table className="w-full text-xs border border-forest-200 rounded-xl overflow-hidden">
          <thead className="bg-forest-50">
            <tr>
              <th className="text-left p-2">Disc name</th>
              <th className="text-left p-2">Type</th>
              <th className="text-right p-2">Speed</th>
              <th className="text-right p-2">Glide</th>
              <th className="text-right p-2">Turn</th>
              <th className="text-right p-2">Fade</th>
              <th className="text-left p-2">Plastic</th>
              <th className="text-left p-2">DB match?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forest-100">
            {noMfr.map(r => {
              const matches = DISC_DB.filter(d => d.name.toLowerCase() === r.disc_name.toLowerCase());
              return (
                <tr key={r.id} className="bg-amber-50/50">
                  <td className="p-2 font-semibold text-forest-800">{r.disc_name}</td>
                  <td className="p-2">{r.type}</td>
                  <td className="p-2 text-right tabular-nums">{r.speed}</td>
                  <td className="p-2 text-right tabular-nums">{r.glide ?? "—"}</td>
                  <td className="p-2 text-right tabular-nums">{r.turn ?? "—"}</td>
                  <td className="p-2 text-right tabular-nums">{r.fade ?? "—"}</td>
                  <td className="p-2">{r.plastic ?? "—"}</td>
                  <td className="p-2">
                    {matches.length > 0
                      ? matches.map(m => `${m.manufacturer} (${m.speed}/${m.glide}/${m.turn}/${m.fade})`).join(", ")
                      : <span className="text-red-600">Not in DB</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Not in DB */}
      <section>
        <h2 className="font-bold text-forest-800 mb-3">Has manufacturer but not in disc DB ({notInDb.length})</h2>
        <table className="w-full text-xs border border-forest-200 rounded-xl overflow-hidden">
          <thead className="bg-forest-50">
            <tr>
              <th className="text-left p-2">Disc name</th>
              <th className="text-left p-2">Manufacturer</th>
              <th className="text-left p-2">Type</th>
              <th className="text-right p-2">Speed</th>
              <th className="text-right p-2">Glide</th>
              <th className="text-right p-2">Turn</th>
              <th className="text-right p-2">Fade</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forest-100">
            {notInDb.map(r => (
              <tr key={r.id} className="bg-red-50/30">
                <td className="p-2 font-semibold text-forest-800">{r.disc_name}</td>
                <td className="p-2 text-forest-600">{r.manufacturer}</td>
                <td className="p-2">{r.type}</td>
                <td className="p-2 text-right tabular-nums">{r.speed}</td>
                <td className="p-2 text-right tabular-nums">{r.glide ?? "—"}</td>
                <td className="p-2 text-right tabular-nums">{r.turn ?? "—"}</td>
                <td className="p-2 text-right tabular-nums">{r.fade ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* All discs */}
      <section>
        <h2 className="font-bold text-forest-800 mb-3">All bag discs ({rows.length})</h2>
        <table className="w-full text-xs border border-forest-200 rounded-xl overflow-hidden">
          <thead className="bg-forest-50">
            <tr>
              <th className="text-left p-2">Disc</th>
              <th className="text-left p-2">Brand</th>
              <th className="text-left p-2">Type</th>
              <th className="text-right p-2">Spd</th>
              <th className="text-right p-2">Gli</th>
              <th className="text-right p-2">Trn</th>
              <th className="text-right p-2">Fde</th>
              <th className="text-left p-2">Plastic</th>
              <th className="text-left p-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forest-100">
            {rows.map(r => {
              const inDb = DISC_DB.find(d =>
                d.name.toLowerCase() === r.disc_name.toLowerCase() &&
                (!r.manufacturer || d.manufacturer.toLowerCase() === (r.manufacturer ?? "").toLowerCase())
              );
              return (
                <tr key={r.id} className={!r.manufacturer ? "bg-amber-50/40" : !inDb ? "bg-red-50/30" : ""}>
                  <td className="p-2 font-medium text-forest-800">{r.disc_name}</td>
                  <td className="p-2 text-forest-600">{r.manufacturer ?? <span className="text-amber-600">MISSING</span>}</td>
                  <td className="p-2 text-[10px]">{r.type}</td>
                  <td className="p-2 text-right tabular-nums">{r.speed}</td>
                  <td className="p-2 text-right tabular-nums">{r.glide ?? "—"}</td>
                  <td className="p-2 text-right tabular-nums">{r.turn ?? "—"}</td>
                  <td className="p-2 text-right tabular-nums">{r.fade ?? "—"}</td>
                  <td className="p-2">{r.plastic ?? "—"}</td>
                  <td className="p-2">
                    {!r.manufacturer ? <span className="text-amber-600">No brand</span>
                      : !inDb ? <span className="text-red-600">Not in DB</span>
                      : <span className="text-green-700">✓</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
