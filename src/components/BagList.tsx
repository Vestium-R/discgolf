"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import type { BagDisc, DiscType } from "@/lib/types";
import type { DiscThrowStats } from "@/lib/store";
import { DISC_TYPE_COLORS, DISC_TYPE_LABELS } from "@/lib/types";
import { removeDiscAction, toggleStorageAction, updateDiscAction } from "@/app/bag/actions";
import { DISC_DB } from "@/lib/discs-db";
import { getPlasticsForManufacturer } from "@/lib/plastics-db";

type SortKey = "type" | "speed" | "manufacturer" | "stability";
const SORT_LABELS: Record<SortKey, string> = { type:"Type", speed:"Speed", manufacturer:"Brand", stability:"Stability" };
const TYPE_ORDER: DiscType[] = ["distance_driver","fairway_driver","midrange","putter"];
const DISC_COLORS = ["red","orange","yellow","green","blue","purple","pink","white","black","grey","teal"];
const COLOR_HEX: Record<string,string> = {
  red:"#ef4444",orange:"#f97316",yellow:"#eab308",green:"#22c55e",
  blue:"#3b82f6",purple:"#a855f7",pink:"#ec4899",white:"#e0e0e0",
  black:"#374151",grey:"#6b7280",teal:"#0d9488",
};

function stabInfo(d: BagDisc) {
  const s = (d.turn??0)+(d.fade??0);
  return s>1 ? {label:"OS",cls:"text-red-600 bg-red-50"} : s<-0.5 ? {label:"US",cls:"text-green-700 bg-green-50"} : {label:"Neu",cls:"text-amber-700 bg-amber-50"};
}
function sortDiscs(discs: BagDisc[], key: SortKey) {
  return [...discs].sort((a,b) => {
    if (key==="type") return TYPE_ORDER.indexOf(a.type)-TYPE_ORDER.indexOf(b.type)||a.speed-b.speed;
    if (key==="speed") return b.speed-a.speed;
    if (key==="manufacturer") return (a.manufacturer??"").localeCompare(b.manufacturer??"")||a.speed-b.speed;
    return ((b.turn??0)+(b.fade??0))-((a.turn??0)+(a.fade??0));
  });
}
function groupByType(discs: BagDisc[]) {
  return TYPE_ORDER.map(t=>({type:t,label:DISC_TYPE_LABELS[t],discs:discs.filter(d=>d.type===t).sort((a,b)=>b.speed-a.speed)})).filter(g=>g.discs.length>0);
}
function groupByBrand(discs: BagDisc[]) {
  const map = new Map<string,BagDisc[]>();
  for (const d of discs) { const b=d.manufacturer||"Other"; map.set(b,[...(map.get(b)??[]),d]); }
  return [...map.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([brand,discs])=>({brand,discs:discs.sort((a,b)=>a.discName.localeCompare(b.discName))}));
}

// ── Edit form ─────────────────────────────────────────────────────────────────
// Sorted unique manufacturers from disc DB
const ALL_BRANDS = [...new Set(DISC_DB.map(d => d.manufacturer))].sort();

function EditForm({disc,onDone}:{disc:BagDisc;onDone:()=>void}) {
  const [pending,startT] = useTransition();
  const [mfr, setMfr] = useState(disc.manufacturer ?? "");
  const plastics = getPlasticsForManufacturer(mfr);

  function submit(fd: FormData) { fd.set("id",disc.id); startT(async()=>{ await updateDiscAction(fd); onDone(); }); }
  return (
    <form action={submit} className="p-3 space-y-3 bg-forest-50 rounded-xl border border-forest-200 m-2">
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-[10px] text-forest-600 block mb-0.5">Name *</label>
          <input name="discName" defaultValue={disc.discName} required className="input-pill text-xs py-1.5"/>
        </div>
        <div><label className="text-[10px] text-forest-600 block mb-0.5">Brand</label>
          <select name="manufacturer" value={mfr} onChange={e => setMfr(e.target.value)} className="input-pill text-xs py-1.5">
            <option value="">— Select —</option>
            {ALL_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
            {mfr && !ALL_BRANDS.includes(mfr) && <option value={mfr}>{mfr}</option>}
          </select>
        </div>
        <div><label className="text-[10px] text-forest-600 block mb-0.5">Type *</label>
          <select name="type" defaultValue={disc.type} required className="input-pill text-xs py-1.5">
            {TYPE_ORDER.map(t=><option key={t} value={t}>{DISC_TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div><label className="text-[10px] text-forest-600 block mb-0.5">Plastic</label>
          {plastics.length > 0 ? (
            <select name="plastic" defaultValue={disc.plastic??""} className="input-pill text-xs py-1.5">
              <option value="">— Select —</option>
              {plastics.map(p=>(
                <option key={p.name} value={p.name}>
                  {p.name} {p.stabilityOffset>0?"↑OS":p.stabilityOffset<0?"↓US":"·"}
                </option>
              ))}
              {disc.plastic && !plastics.find(p=>p.name===disc.plastic) && (
                <option value={disc.plastic}>{disc.plastic}</option>
              )}
            </select>
          ) : (
            <input name="plastic" defaultValue={disc.plastic??""} placeholder="e.g. Star, ESP" className="input-pill text-xs py-1.5"/>
          )}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {[{name:"speed",label:"Spd",v:disc.speed,min:1,max:15},{name:"glide",label:"Gli",v:disc.glide,min:1,max:7},{name:"turn",label:"Trn",v:disc.turn,min:-5,max:2},{name:"fade",label:"Fde",v:disc.fade,min:0,max:5}].map(f=>(
          <div key={f.name}><label className="text-[10px] text-forest-500 block mb-0.5">{f.label}</label>
            <input name={f.name} type="number" step="0.5" min={f.min} max={f.max} defaultValue={f.v??""} required={f.name==="speed"} className="input-pill text-xs py-1.5 text-center px-1"/>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div><label className="text-[10px] text-forest-600 block mb-0.5">Color</label>
          <select name="color" defaultValue={disc.color??""} className="input-pill text-xs py-1.5">
            <option value="">—</option>
            {DISC_COLORS.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
          </select>
        </div>
        <div><label className="text-[10px] text-forest-600 block mb-0.5">Weight (g)</label>
          <input name="weight" type="number" min={130} max={180} step={1} defaultValue={disc.weightG??""} placeholder="175" className="input-pill text-xs py-1.5 text-center"/>
        </div>
        <div><label className="text-[10px] text-forest-600 block mb-0.5">Condition</label>
          <select name="notes" defaultValue={disc.notes??""} className="input-pill text-xs py-1.5">
            <option value="">Fresh</option><option value="Slightly beat">Slightly beat</option><option value="Beat in">Beat in</option><option value="Overstable flip">OS flip</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-primary text-xs py-1.5 px-3">{pending?"Saving…":"Save"}</button>
        <button type="button" onClick={onDone} className="btn-secondary text-xs py-1.5 px-3">Cancel</button>
      </div>
    </form>
  );
}

// ── Disc row ──────────────────────────────────────────────────────────────────
function DiscRow({d,editing,onEdit,onStopEdit,showStorage,stats}:{d:BagDisc;editing:boolean;onEdit:()=>void;onStopEdit:()=>void;showStorage?:boolean;stats?:DiscThrowStats}) {
  const [pending,startT] = useTransition();
  const {label,cls} = stabInfo(d);
  const dot = d.color?(COLOR_HEX[d.color.toLowerCase()]||DISC_TYPE_COLORS[d.type]):DISC_TYPE_COLORS[d.type];

  function remove() { startT(async()=>{ const fd=new FormData(); fd.set("id",d.id); await removeDiscAction(fd); }); }
  function toggle() { startT(async()=>{ const fd=new FormData(); fd.set("id",d.id); fd.set("inStorage",d.inStorage?"0":"1"); await toggleStorageAction(fd); }); }

  if (editing) return <EditForm disc={d} onDone={onStopEdit}/>;

  return (
    <li className="flex items-center gap-2.5 px-4 py-3">
      <span className="w-3 h-3 rounded-full shrink-0 border border-white shadow-sm" style={{backgroundColor:dot}}/>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-forest-800">{d.discName}</span>
          {d.nickname&&<span className="text-xs font-medium text-forest-600 italic">"{d.nickname}"</span>}
          {d.manufacturer&&<span className="text-xs text-forest-400">{d.manufacturer}</span>}
          {d.plastic&&<span className="text-xs text-forest-300">· {d.plastic}</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs tabular-nums text-forest-500">{d.speed}/{d.glide??'—'}/{d.turn??'—'}/{d.fade??'—'}</span>
          {d.weightG&&<span className="text-xs text-forest-400">{d.weightG}g</span>}
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cls}`}>{label}</span>
          {d.notes&&<span className="text-[10px] text-forest-400 italic">{d.notes}</span>}
          {stats&&stats.throwCount>0&&(
            <Link href={`/my-throws?discId=${d.id}`} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
              {stats.throwCount} throw{stats.throwCount!==1?'s':''} · {stats.avgDistanceFt}ft avg
            </Link>
          )}
        </div>
      </div>
      {/* Bigger action buttons */}
      {showStorage&&(
        <button onClick={toggle} disabled={pending} title={d.inStorage?"Move to bag":"Move to storage"}
          className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-sm font-medium text-forest-500 hover:bg-forest-100 hover:text-forest-800 transition-colors shrink-0">
          {d.inStorage?"🎒":"📦"}
        </button>
      )}
      <button onClick={onEdit}
        className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-sm font-medium text-forest-500 hover:bg-forest-100 hover:text-forest-800 transition-colors shrink-0">
        ✏️
      </button>
      <button onClick={remove} disabled={pending}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-red-300 hover:bg-red-50 hover:text-red-600 transition-colors shrink-0">
        ✕
      </button>
    </li>
  );
}

// ── BagList ───────────────────────────────────────────────────────────────────
export function BagList({discs,title,showStorage,gaps,isStorage,throwStats}:{
  discs:BagDisc[];title?:string;showStorage?:boolean;gaps?:string[];isStorage?:boolean;throwStats?:Map<string,DiscThrowStats>;
}) {
  const [sort,setSort] = useState<SortKey>("type");
  const [editId,setEditId] = useState<string|null>(null);
  const [storageOpen,setStorageOpen] = useState(false);

  // Storage section: collapsible
  if (isStorage) {
    return (
      <div>
        <button onClick={()=>setStorageOpen(o=>!o)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-forest-700 hover:bg-forest-50 rounded-2xl border border-forest-100 bg-white transition-colors">
          <span>📦 Storage ({discs.length} disc{discs.length!==1?"s":""})</span>
          <span className="text-forest-400 text-xs">{storageOpen?"▲":"▼"}</span>
        </button>
        {storageOpen && (
          <div className="card overflow-hidden mt-1">
            <ul className="divide-y divide-forest-50">
              {discs.map(d=>(
                <DiscRow key={d.id} d={d} editing={editId===d.id} showStorage stats={throwStats?.get(d.id)}
                  onEdit={()=>setEditId(d.id)} onStopEdit={()=>setEditId(null)}/>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="card overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-forest-100 flex-wrap">
        {title&&<span className="text-sm font-semibold text-forest-800 shrink-0">{title}</span>}
        <div className="flex gap-1 flex-wrap">
          {(Object.keys(SORT_LABELS) as SortKey[]).map(k=>(
            <button key={k} onClick={()=>setSort(k)}
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${sort===k?"bg-forest-700 text-white":"bg-forest-100 text-forest-600 hover:bg-forest-200"}`}>
              {SORT_LABELS[k]}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-forest-400">{discs.length}</span>
      </div>

      {/* Disc list */}
      {sort==="type" ? groupByType(sortDiscs(discs,"type")).map(g=>(
        <div key={g.type}>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-forest-50 border-y border-forest-100">
            <span className="w-2 h-2 rounded-full" style={{backgroundColor:DISC_TYPE_COLORS[g.type]}}/>
            <span className="text-xs font-semibold text-forest-700">{g.label}</span>
            <span className="text-xs text-forest-400 ml-auto">{g.discs.length}</span>
          </div>
          <ul className="divide-y divide-forest-50">
            {g.discs.map(d=><DiscRow key={d.id} d={d} editing={editId===d.id} showStorage={showStorage} stats={throwStats?.get(d.id)} onEdit={()=>setEditId(d.id)} onStopEdit={()=>setEditId(null)}/>)}
          </ul>
        </div>
      )) : sort==="manufacturer" ? groupByBrand(discs).map(g=>(
        <div key={g.brand}>
          <div className="px-4 py-1.5 bg-forest-50 border-y border-forest-100">
            <span className="text-xs font-semibold text-forest-700">{g.brand}</span>
            <span className="text-xs text-forest-400 ml-2">{g.discs.length}</span>
          </div>
          <ul className="divide-y divide-forest-50">
            {g.discs.map(d=><DiscRow key={d.id} d={d} editing={editId===d.id} showStorage={showStorage} stats={throwStats?.get(d.id)} onEdit={()=>setEditId(d.id)} onStopEdit={()=>setEditId(null)}/>)}
          </ul>
        </div>
      )) : (
        <ul className="divide-y divide-forest-50">
          {sortDiscs(discs,sort).map(d=><DiscRow key={d.id} d={d} editing={editId===d.id} showStorage={showStorage} stats={throwStats?.get(d.id)} onEdit={()=>setEditId(d.id)} onStopEdit={()=>setEditId(null)}/>)}
        </ul>
      )}

      {/* Gaps inline */}
      {gaps&&gaps.length>0&&(
        <div className="border-t border-forest-100 px-4 py-2.5 flex flex-wrap gap-1.5">
          {gaps.map((g,i)=>(
            <span key={i} className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
              ⚠ {g}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
