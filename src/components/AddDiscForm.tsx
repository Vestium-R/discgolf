"use client";
import { useRef, useState, useTransition } from "react";
import { searchDiscs, type DiscRecord } from "@/lib/discs-db";
import { DISC_TYPE_LABELS, type DiscType } from "@/lib/types";
import { addDiscAction } from "@/app/bag/actions";
import { getPlasticsForManufacturer, type PlasticRecord } from "@/lib/plastics-db";

const TYPE_ORDER: DiscType[] = ["distance_driver", "fairway_driver", "midrange", "putter"];
const COLORS = ["red","orange","yellow","green","blue","purple","pink","white","black","grey","teal"];

const STAB_LABEL: Record<string, string> = {
  "Most Overstable": "most OS", "Overstable": "OS",
  "Slightly Understable": "slightly US", "Stable": "stable",
  "Understable": "US",
};
const FIRM_ICON: Record<PlasticRecord["firmness"], string> = {
  hard: "🪨", firm: "◼", medium: "▪", flexible: "〰", soft: "🫧",
};
const BREAK_LABEL: Record<PlasticRecord["breakIn"], string> = {
  slow: "holds shape long", medium: "moderate beat-in", fast: "beats in quickly",
};
const DUR_STARS = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

export function AddDiscForm({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DiscRecord[]>([]);
  const [selected, setSelected] = useState<DiscRecord | null>(null);
  const [manufacturer, setManufacturer] = useState("");
  const [selectedPlastic, setSelectedPlastic] = useState<PlasticRecord | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const availablePlastics = getPlasticsForManufacturer(manufacturer);

  function onSearch(val: string) {
    setQuery(val); setSelected(null); setSelectedPlastic(null);
    setResults(searchDiscs(val));
  }

  function pick(disc: DiscRecord) {
    setSelected(disc);
    setManufacturer(disc.manufacturer);
    setSelectedPlastic(null);
    setQuery(disc.name); // search box becomes the disc name field
    setResults([]);
  }

  function pickPlastic(name: string) {
    const p = availablePlastics.find(x => x.name === name) ?? null;
    setSelectedPlastic(p);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await addDiscAction(formData);
      setQuery(""); setSelected(null); setSelectedPlastic(null);
      setManufacturer(""); setResults([]);
      formRef.current?.reset();
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-primary w-full">
        + Add disc
      </button>
    );
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-forest-800">Add a disc</span>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-forest-400 hover:text-forest-700">✕ Cancel</button>
      </div>

      {/* Disc search */}
      <div className="relative">
        <label className="text-xs font-semibold text-forest-700 block mb-1">
          Disc name *
          {!selected && <span className="font-normal text-forest-400 ml-1">— search the database or type manually</span>}
          {selected && <span className="font-normal text-green-700 ml-1">✓ auto-filled from database</span>}
        </label>
        <input name="discName" required value={query} onChange={e => onSearch(e.target.value)}
          placeholder="Search discs… e.g. Destroyer, Buzzz, Kastaplast"
          className="input-pill text-sm" autoComplete="off" />
        {results.length > 0 && (
          <ul className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-forest-200 rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-forest-50">
            {results.map((d, i) => (
              <li key={i}>
                <button type="button" onClick={() => pick(d)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-forest-50 text-left">
                  <div>
                    <span className="text-sm font-semibold text-forest-800">{d.name}</span>
                    <span className="text-xs text-forest-500 ml-1.5">{d.manufacturer}</span>
                  </div>
                  <div className="text-xs tabular-nums text-forest-400 ml-3 shrink-0">
                    {d.speed}/{d.glide}/{d.turn}/{d.fade}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Manufacturer */}
      <div>
        <label className="text-xs font-semibold text-forest-700 block mb-1">Manufacturer</label>
        <input name="manufacturer"
          value={selected ? selected.manufacturer : manufacturer}
          onChange={e => { setManufacturer(e.target.value); setSelectedPlastic(null); }}
          placeholder="e.g. Innova" className="input-pill text-sm" />
      </div>

      {/* Type + Plastic */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">Type *</label>
          <select name="type" required defaultValue={selected?.type ?? ""} key={selected?.type ?? "type"}
            className="input-pill text-sm">
            <option value="">Select…</option>
            {TYPE_ORDER.map(t => <option key={t} value={t}>{DISC_TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">
            Plastic
            {availablePlastics.length > 0 && (
              <span className="font-normal text-forest-400 ml-1">({availablePlastics.length} options)</span>
            )}
          </label>
          {availablePlastics.length > 0 ? (
            <select name="plastic" className="input-pill text-sm"
              onChange={e => pickPlastic(e.target.value)}
              defaultValue="">
              <option value="">— Select plastic —</option>
              {availablePlastics.map(p => (
                <option key={p.name} value={p.name}>
                  {p.name} {p.stabilityOffset > 0 ? "↑OS" : p.stabilityOffset < 0 ? "↓US" : "·"} {DUR_STARS(p.durability)}
                </option>
              ))}
            </select>
          ) : (
            <input name="plastic" placeholder="e.g. Star, ESP, K1" className="input-pill text-sm" />
          )}
        </div>
      </div>

      {/* Plastic properties card */}
      {selectedPlastic && (
        <div className="rounded-xl bg-forest-50 border border-forest-100 px-3 py-2.5 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-forest-400">Durability</span>
            <span className="text-forest-800 font-semibold">{DUR_STARS(selectedPlastic.durability)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-forest-400">Feel</span>
            <span className="text-forest-800 font-semibold">{FIRM_ICON[selectedPlastic.firmness]} {selectedPlastic.firmness}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-forest-400">Break-in</span>
            <span className="text-forest-800 font-semibold">{BREAK_LABEL[selectedPlastic.breakIn]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-forest-400">Stability</span>
            <span className={`font-semibold ${selectedPlastic.stabilityOffset > 0 ? "text-red-600" : selectedPlastic.stabilityOffset < 0 ? "text-green-700" : "text-forest-600"}`}>
              {selectedPlastic.stabilityOffset > 0 ? `+${selectedPlastic.stabilityOffset} more OS` :
               selectedPlastic.stabilityOffset < 0 ? `${selectedPlastic.stabilityOffset} more US` : "true to numbers"}
            </span>
          </div>
        </div>
      )}

      {/* Nickname + Color + Weight */}
      <div>
        <label className="text-xs font-semibold text-forest-700 block mb-1">
          Nickname <span className="font-normal text-forest-400">(optional — for two of the same disc)</span>
        </label>
        <input name="nickname" placeholder='e.g. "The Flipper", "Headwind Destroyer"'
          className="input-pill text-sm" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">Color</label>
          <select name="color" className="input-pill text-sm">
            <option value="">—</option>
            {COLORS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">Weight (g)</label>
          <input name="weight" type="number" min={130} max={180} step={1} placeholder="175"
            className="input-pill text-sm" />
        </div>
      </div>

      {/* Flight numbers */}
      <div>
        <p className="text-xs font-semibold text-forest-700 mb-1">
          Flight numbers
          {selected && <span className="ml-1 font-normal text-forest-400">· auto-filled from database</span>}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { name:"speed", label:"Speed", v:selected?.speed, min:1,  max:15, placeholder:"7"  },
            { name:"glide", label:"Glide", v:selected?.glide, min:1,  max:7,  placeholder:"5"  },
            { name:"turn",  label:"Turn",  v:selected?.turn,  min:-5, max:2,  placeholder:"-1" },
            { name:"fade",  label:"Fade",  v:selected?.fade,  min:0,  max:5,  placeholder:"2"  },
          ].map(f => (
            <div key={f.name}>
              <label className="text-[10px] text-forest-500 block mb-0.5">{f.label}</label>
              <input name={f.name} type="number" step="0.5" min={f.min} max={f.max}
                placeholder={f.placeholder} required={f.name==="speed"}
                defaultValue={f.v ?? ""} key={String(f.v ?? f.name)}
                className="input-pill text-sm text-center px-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Condition */}
      <div>
        <label className="text-xs font-semibold text-forest-700 block mb-1">Condition</label>
        <select name="notes" className="input-pill text-sm w-full">
          <option value="">—</option>
          <option value="Fresh">Fresh</option>
          <option value="Slightly beat">Slightly beat</option>
          <option value="Beat in">Beat in</option>
          <option value="OS flip">OS flip</option>
        </select>
      </div>

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Adding…" : "Add to bag"}
      </button>
    </form>
  );
}
