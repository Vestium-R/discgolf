"use client";
import { useState, useTransition } from "react";
import type { BagDisc } from "@/lib/types";

type MeasureMode = "distance" | "review";

export function MeasureThrow({
  disc,
  onClose,
  onSuccess,
}: {
  disc: BagDisc;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [mode, setMode] = useState<MeasureMode>("distance");
  const [distance, setDistance] = useState("");
  const [windMph, setWindMph] = useState("");
  const [windDir, setWindDir] = useState<"calm" | "head" | "tail" | "cross" | "">("");
  const [courseName, setCourseName] = useState("");
  const [holeNumber, setHoleNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!distance || parseInt(distance) < 50 || parseInt(distance) > 600) {
      setError("Distance must be 50–600 ft");
      return;
    }

    setError(null);
    setMode("review");
  }

  function confirm() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/throws/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bagDiscId: disc.id,
            distanceFt: parseInt(distance),
            windMph: windMph ? parseInt(windMph) : null,
            windDirection: windDir || null,
            courseName: courseName || null,
            holeNumber: holeNumber ? parseInt(holeNumber) : null,
            notes: notes || null,
          }),
        });

        if (!res.ok) throw new Error("Failed to log throw");
        onSuccess?.();
        onClose();
      } catch (err) {
        setError(String(err));
      }
    });
  }

  if (mode === "distance") {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="card p-6 max-w-sm w-full space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-forest-800">Measure throw</h3>
            <button onClick={onClose} className="text-xs text-forest-400">✕</button>
          </div>

          <div className="text-sm text-forest-700">
            <span className="font-semibold">{disc.discName}</span>
            <span className="text-forest-500 ml-2">{disc.speed}/{disc.glide ?? '—'}/{disc.turn ?? '—'}/{disc.fade ?? '—'}</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-forest-700 block mb-1">
              Distance (ft) *
            </label>
            <input
              type="number"
              min={50}
              max={600}
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="e.g. 280"
              className="input-pill w-full text-lg text-center font-bold"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-forest-700 block mb-1.5">Wind (optional)</label>
            <div className="space-y-2">
              <select
                value={windDir}
                onChange={(e) => setWindDir(e.target.value as any)}
                className="input-pill w-full text-sm"
              >
                <option value="">— None —</option>
                <option value="calm">Calm</option>
                <option value="head">Headwind</option>
                <option value="tail">Tailwind</option>
                <option value="cross">Crosswind</option>
              </select>
              {windDir && (
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={windMph}
                  onChange={(e) => setWindMph(e.target.value)}
                  placeholder="mph"
                  className="input-pill w-full text-sm"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="Course"
              className="input-pill text-xs"
            />
            <input
              type="number"
              min={1}
              max={27}
              value={holeNumber}
              onChange={(e) => setHoleNumber(e.target.value)}
              placeholder="Hole #"
              className="input-pill text-xs"
            />
          </div>

          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (conditions, form, etc.)"
            className="input-pill text-xs w-full"
          />

          {error && <p className="text-xs text-red-700 bg-red-50 p-2 rounded">{error}</p>}

          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary flex-1 text-sm">Cancel</button>
            <button onClick={submit} className="btn-primary flex-1 text-sm">Review</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card p-6 max-w-sm w-full space-y-4">
        <h3 className="font-display font-bold text-forest-800">Confirm throw</h3>

        <div className="bg-forest-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-forest-600">Disc</span>
            <span className="font-semibold text-forest-800">{disc.discName}</span>
          </div>
          <div className="flex justify-between text-lg">
            <span className="text-forest-600">Distance</span>
            <span className="font-bold text-forest-900">{distance} ft</span>
          </div>
          {windDir && (
            <div className="flex justify-between text-sm">
              <span className="text-forest-600">Wind</span>
              <span className="font-semibold text-forest-800">
                {windDir} {windMph ? `${windMph} mph` : ""}
              </span>
            </div>
          )}
          {courseName && (
            <div className="flex justify-between text-xs text-forest-600">
              <span>{courseName}</span>
              {holeNumber && <span>Hole {holeNumber}</span>}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={() => setMode("distance")} className="btn-secondary flex-1 text-sm">
            Back
          </button>
          <button onClick={confirm} disabled={pending} className="btn-primary flex-1 text-sm">
            {pending ? "Saving…" : "Save throw"}
          </button>
        </div>
      </div>
    </div>
  );
}
