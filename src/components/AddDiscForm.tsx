"use client";
import { useRef, useState, useTransition } from "react";
import { searchDiscs, type DiscRecord } from "@/lib/discs-db";
import { DISC_TYPE_LABELS, type DiscType } from "@/lib/types";
import { addDiscAction } from "@/app/bag/actions";

const TYPE_ORDER: DiscType[] = ["distance_driver", "fairway_driver", "midrange", "putter"];

export function AddDiscForm() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DiscRecord[]>([]);
  const [selected, setSelected] = useState<DiscRecord | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function onSearch(val: string) {
    setQuery(val);
    setSelected(null);
    setResults(searchDiscs(val));
  }

  function pick(disc: DiscRecord) {
    setSelected(disc);
    setQuery(`${disc.manufacturer} ${disc.name}`);
    setResults([]);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await addDiscAction(formData);
      setQuery("");
      setSelected(null);
      setResults([]);
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3">
      {/* Disc search */}
      <div className="relative">
        <label className="text-xs font-semibold text-forest-700 block mb-1">
          Search disc <span className="font-normal text-forest-400">(or fill in manually below)</span>
        </label>
        <input
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="e.g. Destroyer, Buzzz, Innova…"
          className="input-pill text-sm"
          autoComplete="off"
        />
        {results.length > 0 && (
          <ul className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-forest-200 rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-forest-50">
            {results.map((d, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => pick(d)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-forest-50 text-left"
                >
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

      {/* Fields — pre-filled from selection or manual */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="text-xs font-semibold text-forest-700 block mb-1">Disc name *</label>
          <input
            name="discName"
            required
            defaultValue={selected?.name ?? ""}
            key={selected?.name ?? "name"}
            placeholder="e.g. Destroyer"
            className="input-pill text-sm"
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="text-xs font-semibold text-forest-700 block mb-1">Manufacturer</label>
          <input
            name="manufacturer"
            defaultValue={selected?.manufacturer ?? ""}
            key={selected?.manufacturer ?? "mfr"}
            placeholder="e.g. Innova"
            className="input-pill text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">Type *</label>
          <select name="type" required defaultValue={selected?.type ?? ""} key={selected?.type ?? "type"} className="input-pill text-sm">
            <option value="">Select…</option>
            {TYPE_ORDER.map((t) => (
              <option key={t} value={t}>{DISC_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">Plastic</label>
          <input name="plastic" placeholder="e.g. Star, ESP" className="input-pill text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">Color</label>
          <select name="color" className="input-pill text-sm">
            <option value="">—</option>
            {["red","orange","yellow","green","blue","purple","pink","white","black","grey","teal"].map(c=>(
              <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">Weight (g)</label>
          <input name="weight" type="number" min={130} max={180} step={1} placeholder="175"
            className="input-pill text-sm" />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-forest-700 mb-1">
          Flight numbers
          {selected && (
            <span className="ml-1 font-normal text-forest-400">· auto-filled from database</span>
          )}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { name: "speed", label: "Speed", v: selected?.speed, min: 1, max: 14, placeholder: "7" },
            { name: "glide", label: "Glide", v: selected?.glide, min: 1, max: 7, placeholder: "5" },
            { name: "turn", label: "Turn", v: selected?.turn, min: -5, max: 2, placeholder: "-1" },
            { name: "fade", label: "Fade", v: selected?.fade, min: 0, max: 5, placeholder: "2" },
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
                defaultValue={f.v ?? ""}
                key={String(f.v ?? f.name)}
                className="input-pill text-sm text-center px-1"
              />
            </div>
          ))}
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Adding…" : "Add to bag"}
      </button>
    </form>
  );
}
