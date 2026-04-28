"use client";
import { useState, useTransition } from "react";
import type { BagDisc, DiscType } from "@/lib/types";
import { DISC_TYPE_COLORS, DISC_TYPE_LABELS } from "@/lib/types";
import { removeDiscAction, updateDiscAction } from "@/app/bag/actions";

type SortKey = "type" | "speed" | "manufacturer" | "stability";

const SORT_LABELS: Record<SortKey, string> = {
  type: "Type",
  speed: "Speed",
  manufacturer: "Brand",
  stability: "Stability",
};

const TYPE_ORDER: DiscType[] = ["distance_driver", "fairway_driver", "midrange", "putter"];

const DISC_COLORS = ["red","orange","yellow","green","blue","purple","pink","white","black","grey","teal"];

const COLOR_HEX: Record<string, string> = {
  red:"#ef4444", orange:"#f97316", yellow:"#eab308", green:"#22c55e",
  blue:"#3b82f6", purple:"#a855f7", pink:"#ec4899", white:"#e5e7eb",
  black:"#374151", grey:"#9ca3af", teal:"#14b8a6",
};

function stabLabel(d: BagDisc) {
  const s = (d.turn??0)+(d.fade??0);
  return s > 1 ? { label:"OS", cls:"text-red-600 bg-red-50" }
       : s < -0.5 ? { label:"US", cls:"text-green-700 bg-green-50" }
       : { label:"Neutral", cls:"text-amber-700 bg-amber-50" };
}

function sortDiscs(discs: BagDisc[], key: SortKey): BagDisc[] {
  return [...discs].sort((a,b) => {
    switch(key) {
      case "type": return TYPE_ORDER.indexOf(a.type)-TYPE_ORDER.indexOf(b.type) || a.speed-b.speed;
      case "speed": return b.speed-a.speed;
      case "manufacturer": return (a.manufacturer??"").localeCompare(b.manufacturer??"") || a.discName.localeCompare(b.discName);
      case "stability": return ((b.turn??0)+(b.fade??0))-((a.turn??0)+(a.fade??0));
    }
  });
}

function groupByType(discs: BagDisc[]): { type: DiscType; label: string; discs: BagDisc[] }[] {
  return TYPE_ORDER
    .map(type => ({ type, label: DISC_TYPE_LABELS[type], discs: discs.filter(d=>d.type===type).sort((a,b)=>a.speed-b.speed) }))
    .filter(g => g.discs.length > 0);
}

function groupByBrand(discs: BagDisc[]): { brand: string; discs: BagDisc[] }[] {
  const map = new Map<string, BagDisc[]>();
  for (const d of discs) {
    const brand = d.manufacturer || "Other";
    map.set(brand, [...(map.get(brand)??[]), d]);
  }
  return [...map.entries()]
    .sort(([a],[b]) => a.localeCompare(b))
    .map(([brand,discs]) => ({ brand, discs: discs.sort((a,b)=>a.discName.localeCompare(b.discName)) }));
}

// ── Edit form ────────────────────────────────────────────────────────────────

function EditForm({ disc, onDone }: { disc: BagDisc; onDone: () => void }) {
  const [pending, startTransition] = useTransition();

  function submit(fd: FormData) {
    fd.set("id", disc.id);
    startTransition(async () => {
      await updateDiscAction(fd);
      onDone();
    });
  }

  return (
    <form action={submit} className="p-3 space-y-3 bg-forest-50 rounded-xl border border-forest-200 m-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-forest-600 block mb-0.5">Name *</label>
          <input name="discName" defaultValue={disc.discName} required className="input-pill text-xs py-1.5" />
        </div>
        <div>
          <label className="text-[10px] text-forest-600 block mb-0.5">Brand</label>
          <input name="manufacturer" defaultValue={disc.manufacturer??""} className="input-pill text-xs py-1.5" />
        </div>
        <div>
          <label className="text-[10px] text-forest-600 block mb-0.5">Type *</label>
          <select name="type" defaultValue={disc.type} required className="input-pill text-xs py-1.5">
            {TYPE_ORDER.map(t=><option key={t} value={t}>{DISC_TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-forest-600 block mb-0.5">Plastic</label>
          <input name="plastic" defaultValue={disc.plastic??""} className="input-pill text-xs py-1.5" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {[
          {name:"speed",label:"Spd",v:disc.speed,min:1,max:14},
          {name:"glide",label:"Gli",v:disc.glide,min:1,max:7},
          {name:"turn", label:"Trn",v:disc.turn, min:-5,max:2},
          {name:"fade", label:"Fde",v:disc.fade, min:0,max:5},
        ].map(f=>(
          <div key={f.name}>
            <label className="text-[10px] text-forest-500 block mb-0.5">{f.label}</label>
            <input name={f.name} type="number" step="0.5" min={f.min} max={f.max}
              defaultValue={f.v??""} required={f.name==="speed"}
              className="input-pill text-xs py-1.5 text-center px-1" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-forest-600 block mb-0.5">Color</label>
          <select name="color" defaultValue={disc.color??""} className="input-pill text-xs py-1.5">
            <option value="">—</option>
            {DISC_COLORS.map(c=><option key={c} value={c} style={{color:COLOR_HEX[c]||"inherit"}}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-forest-600 block mb-0.5">Weight (g)</label>
          <input name="weight" type="number" min={130} max={180} step={1}
            defaultValue={disc.weightG??""} placeholder="175"
            className="input-pill text-xs py-1.5 text-center" />
        </div>
        <div>
          <label className="text-[10px] text-forest-600 block mb-0.5">Condition</label>
          <select name="notes" defaultValue={disc.notes??""} className="input-pill text-xs py-1.5">
            <option value="">Fresh</option>
            <option value="Slightly beat">Slightly beat</option>
            <option value="Beat in">Beat in</option>
            <option value="Overstable flip">Overstable flip</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary text-xs py-1.5 px-3">
          {pending?"Saving…":"Save"}
        </button>
        <button type="button" onClick={onDone} className="btn-secondary text-xs py-1.5 px-3">Cancel</button>
      </div>
    </form>
  );
}

// ── Disc row ─────────────────────────────────────────────────────────────────

function DiscRow({ d, editing, onEdit, onStopEdit }: {
  d: BagDisc; editing: boolean; onEdit: () => void; onStopEdit: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const { label, cls } = stabLabel(d);
  const dotColor = d.color ? (COLOR_HEX[d.color.toLowerCase()]||DISC_TYPE_COLORS[d.type]) : DISC_TYPE_COLORS[d.type];

  function remove() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", d.id);
      await removeDiscAction(fd);
    });
  }

  if (editing) return <EditForm disc={d} onDone={onStopEdit} />;

  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <span className="w-3 h-3 rounded-full shrink-0 border border-white shadow-sm"
        style={{backgroundColor: dotColor}} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-forest-800">{d.discName}</span>
          {d.manufacturer && <span className="text-xs text-forest-400">{d.manufacturer}</span>}
          {d.plastic && <span className="text-xs text-forest-300">· {d.plastic}</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs tabular-nums text-forest-500">
            {d.speed}/{d.glide??'—'}/{d.turn??'—'}/{d.fade??'—'}
          </span>
          {d.weightG && <span className="text-xs text-forest-400">{d.weightG}g</span>}
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cls}`}>{label}</span>
          {d.notes && <span className="text-[10px] text-forest-400 italic">{d.notes}</span>}
        </div>
      </div>
      <button onClick={onEdit} className="text-xs text-forest-400 hover:text-forest-700 px-1 transition-colors shrink-0">✏</button>
      <button onClick={remove} disabled={pending} className="text-xs text-forest-300 hover:text-red-600 px-1 transition-colors shrink-0">✕</button>
    </li>
  );
}

// ── BagList ───────────────────────────────────────────────────────────────────

export function BagList({ discs }: { discs: BagDisc[] }) {
  const [sort, setSort] = useState<SortKey>("type");
  const [editId, setEditId] = useState<string|null>(null);

  const useGroups = sort === "type" || sort === "manufacturer";

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-forest-100 flex-wrap">
        <span className="text-xs text-forest-500 shrink-0">Sort</span>
        {(Object.keys(SORT_LABELS) as SortKey[]).map(k=>(
          <button key={k} onClick={()=>setSort(k)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              sort===k?"bg-forest-700 text-white":"bg-forest-100 text-forest-600 hover:bg-forest-200"
            }`}>
            {SORT_LABELS[k]}
          </button>
        ))}
        <span className="ml-auto text-xs text-forest-400">{discs.length} discs</span>
      </div>

      {sort === "type" ? (
        groupByType(discs).map(group => (
          <div key={group.type}>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-forest-50 border-y border-forest-100">
              <span className="w-2 h-2 rounded-full" style={{backgroundColor:DISC_TYPE_COLORS[group.type]}}/>
              <span className="text-xs font-semibold text-forest-700">{group.label}</span>
              <span className="text-xs text-forest-400 ml-auto">{group.discs.length}</span>
            </div>
            <ul className="divide-y divide-forest-50">
              {group.discs.map(d=>(
                <DiscRow key={d.id} d={d} editing={editId===d.id}
                  onEdit={()=>setEditId(d.id)} onStopEdit={()=>setEditId(null)}/>
              ))}
            </ul>
          </div>
        ))
      ) : sort === "manufacturer" ? (
        groupByBrand(discs).map(group => (
          <div key={group.brand}>
            <div className="px-4 py-1.5 bg-forest-50 border-y border-forest-100">
              <span className="text-xs font-semibold text-forest-700">{group.brand}</span>
              <span className="text-xs text-forest-400 ml-2">{group.discs.length}</span>
            </div>
            <ul className="divide-y divide-forest-50">
              {group.discs.map(d=>(
                <DiscRow key={d.id} d={d} editing={editId===d.id}
                  onEdit={()=>setEditId(d.id)} onStopEdit={()=>setEditId(null)}/>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <ul className="divide-y divide-forest-50">
          {sortDiscs(discs, sort).map(d=>(
            <DiscRow key={d.id} d={d} editing={editId===d.id}
              onEdit={()=>setEditId(d.id)} onStopEdit={()=>setEditId(null)}/>
          ))}
        </ul>
      )}
    </section>
  );
}
