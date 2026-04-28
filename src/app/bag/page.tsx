import { getUser } from "@/lib/auth";
import { getBagDiscs } from "@/lib/store";
import { SignInForm } from "@/components/SignInForm";
import { BagChart } from "@/components/BagChart";
import { addDiscAction, removeDiscAction } from "./actions";
import type { BagDisc, DiscType } from "@/lib/types";
import { DISC_TYPE_LABELS, DISC_TYPE_COLORS } from "@/lib/types";

export const dynamic = "force-dynamic";

// ── Gap analysis ────────────────────────────────────────────────────────────

function analyzeBag(discs: BagDisc[]): string[] {
  if (discs.length === 0) return [];
  const gaps: string[] = [];

  const byType = (t: DiscType) => discs.filter((d) => d.type === t);
  const putters = byType("putter");
  const mids = byType("midrange");
  const fairways = byType("fairway_driver");
  const distance = byType("distance_driver");

  if (putters.length === 0) gaps.push("No putter — you need one for short shots and the basket.");
  if (mids.length === 0) gaps.push("No midrange — great for controlled approach shots and wooded courses.");
  if (fairways.length === 0 && distance.length === 0) gaps.push("No driver at all — add a fairway driver to start.");

  const drivers = [...fairways, ...distance];
  if (drivers.length >= 2) {
    const stabs = drivers.map((d) => (d.turn ?? 0) + (d.fade ?? 0));
    if (!stabs.some((s) => s < -0.5)) gaps.push("All your drivers are overstable or neutral — add an understable driver for distance and flex shots.");
    if (!stabs.some((s) => s > 1)) gaps.push("No overstable driver — useful for headwind shots and reliable left-finishing fades.");
    if (!stabs.some((s) => s >= -0.5 && s <= 1)) gaps.push("No neutral driver — a straight flyer helps with controlled distance shots.");
  }

  if (fairways.length === 0 && distance.length > 0) gaps.push("No fairway driver — a lower-speed driver is easier to control on tight holes.");
  if (distance.length === 0 && fairways.length > 0) gaps.push("No distance driver — consider one if you want to reach longer holes.");

  if (putters.length >= 1 && mids.length === 0 && drivers.length >= 1)
    gaps.push("Gap between putter and driver — a midrange would give you more shot options.");

  return gaps;
}

// ── Page ────────────────────────────────────────────────────────────────────

const TYPE_ORDER: DiscType[] = ["distance_driver", "fairway_driver", "midrange", "putter"];

export default async function BagPage() {
  const user = await getUser();

  if (!user) {
    return (
      <div className="space-y-6 max-w-sm mx-auto pt-6">
        <header>
          <h2 className="font-display text-2xl font-bold text-forest-800">My Bag</h2>
          <p className="text-sm text-forest-600 mt-1">Sign in to track your discs and spot gaps in your bag.</p>
        </header>
        <div className="card p-5">
          <p className="text-sm font-semibold text-forest-800 mb-3">Sign in with your email</p>
          <SignInForm redirectAfter="/bag" />
        </div>
      </div>
    );
  }

  const discs = await getBagDiscs(user.id);
  const gaps = analyzeBag(discs);

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    label: DISC_TYPE_LABELS[type],
    color: DISC_TYPE_COLORS[type],
    discs: discs.filter((d) => d.type === type).sort((a, b) => a.speed - b.speed),
  })).filter((g) => g.discs.length > 0);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-forest-800">My Bag</h2>
          <p className="text-sm text-forest-600">{discs.length} disc{discs.length !== 1 ? "s" : ""} · {user.email}</p>
        </div>
      </header>

      {/* Add disc form */}
      <section className="card p-5 space-y-4">
        <h3 className="font-display font-bold text-forest-800">Add a disc</h3>
        <form action={addDiscAction} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-forest-700 block mb-1">Disc name *</label>
              <input name="discName" required placeholder="e.g. Destroyer" className="input-pill text-sm" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs font-semibold text-forest-700 block mb-1">Manufacturer</label>
              <input name="manufacturer" placeholder="e.g. Innova" className="input-pill text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-forest-700 block mb-1">Type *</label>
              <select name="type" required className="input-pill text-sm">
                <option value="">Select…</option>
                {TYPE_ORDER.map((t) => (
                  <option key={t} value={t}>{DISC_TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-forest-700 block mb-1">Plastic</label>
              <input name="plastic" placeholder="e.g. Star, Champion" className="input-pill text-sm" />
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-forest-700 mb-1">Flight numbers</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { name: "speed", label: "Speed", placeholder: "7", min: 1, max: 14 },
                { name: "glide", label: "Glide", placeholder: "5", min: 1, max: 7 },
                { name: "turn", label: "Turn", placeholder: "-1", min: -5, max: 2 },
                { name: "fade", label: "Fade", placeholder: "2", min: 0, max: 5 },
              ].map((f) => (
                <div key={f.name}>
                  <label className="text-[10px] text-forest-500 block mb-0.5">{f.label}</label>
                  <input
                    name={f.name}
                    type="number"
                    step="0.5"
                    min={f.min}
                    max={f.max}
                    placeholder={f.placeholder}
                    required={f.name === "speed"}
                    className="input-pill text-sm text-center px-1"
                  />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary w-full">Add to bag</button>
        </form>
      </section>

      {/* Disc list */}
      {grouped.length > 0 && (
        <section className="space-y-3">
          {grouped.map((group) => (
            <div key={group.type} className="card overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-forest-100">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: group.color }} />
                <h3 className="font-semibold text-sm text-forest-800">{group.label}</h3>
                <span className="text-xs text-forest-500 ml-auto">{group.discs.length}</span>
              </div>
              <ul className="divide-y divide-forest-50">
                {group.discs.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-forest-800 truncate">{d.discName}</p>
                      <p className="text-xs text-forest-500">
                        {[d.manufacturer, d.plastic].filter(Boolean).join(" · ")}
                        {(d.speed || d.glide || d.turn != null || d.fade != null) && (
                          <span className="ml-1 tabular-nums">
                            {" · "}{d.speed} / {d.glide ?? "—"} / {d.turn ?? "—"} / {d.fade ?? "—"}
                          </span>
                        )}
                      </p>
                    </div>
                    <form action={removeDiscAction}>
                      <input type="hidden" name="id" value={d.id} />
                      <button type="submit" className="text-xs text-red-400 hover:text-red-700 px-1">✕</button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* Chart */}
      {discs.length >= 2 && (
        <section className="card p-4 space-y-3">
          <h3 className="font-display font-bold text-forest-800">Bag chart</h3>
          <p className="text-xs text-forest-500">Speed → X axis · Stability (turn + fade) → Y axis</p>
          <BagChart discs={discs} />
        </section>
      )}

      {/* Gap analysis */}
      {gaps.length > 0 && (
        <section className="card p-4 space-y-3">
          <h3 className="font-display font-bold text-forest-800">Bag gaps</h3>
          <ul className="space-y-2">
            {gaps.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-forest-700">
                <span className="mt-0.5 shrink-0 text-amber-500">⚠</span>
                {g}
              </li>
            ))}
          </ul>
        </section>
      )}

      {discs.length === 0 && (
        <div className="card p-8 text-center text-forest-500">
          <p className="text-4xl mb-3">🎯</p>
          <p className="font-semibold">Your bag is empty</p>
          <p className="text-sm mt-1">Add your first disc above to get started.</p>
        </div>
      )}
    </div>
  );
}
