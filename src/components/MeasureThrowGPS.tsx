"use client";
import { useState, useTransition } from "react";
import type { BagDisc } from "@/lib/types";

type Stage = "idle" | "tracking" | "confirm" | "select-disc";

interface GPSPoint {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

function haversineDistance(p1: GPSPoint, p2: GPSPoint): number {
  const R = 20925591; // Earth radius in feet
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function MeasureThrowGPS({ discs }: { discs: BagDisc[] }) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [startPoint, setStartPoint] = useState<GPSPoint | null>(null);
  const [currentPoint, setCurrentPoint] = useState<GPSPoint | null>(null);
  const [distanceFt, setDistanceFt] = useState(0);
  const [selectedDiscId, setSelectedDiscId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  const bagDiscs = discs.filter(d => !d.inStorage);
  const selectedDisc = selectedDiscId ? bagDiscs.find(d => d.id === selectedDiscId) : null;

  function startTracking() {
    setError(null);
    if (!navigator.geolocation) {
      setError("GPS not available on this device");
      return;
    }

    setStage("tracking");
    setDistanceFt(0);
    setCurrentPoint(null);

    // Start watching position immediately to let GPS warm up
    let bestPosition: GPSPoint | null = null;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const current: GPSPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: Date.now(),
        };

        // Capture first position as starting point when accuracy is decent
        if (!startPoint && pos.coords.accuracy < 50) {
          setStartPoint(current);
        }

        // Update current position and distance
        if (startPoint) {
          setCurrentPoint(current);
          const dist = haversineDistance(startPoint, current);
          setDistanceFt(Math.round(Math.max(dist, 0)));
        }
      },
      (err) => {
        setError(`GPS error: ${err.message}`);
        setStage("idle");
      },
      { enableHighAccuracy: true, timeout: 3000, maximumAge: 0 }
    );
    setWatchId(id);
  }

  function stopTracking() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }

    if (!startPoint || distanceFt < 30 || distanceFt > 600) {
      setError("Distance must be 30–600 ft");
      return;
    }

    setStage("select-disc");
  }


  function saveThrow() {
    if (!selectedDiscId) {
      setError("Please select a disc");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/throws/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bagDiscId: selectedDiscId,
            distanceFt,
            windMph: null,
            windDirection: null,
            courseName: null,
            holeNumber: null,
            notes: "GPS measured",
          }),
        });

        if (!res.ok) throw new Error("Failed to log throw");
        setOpen(false);
        setStage("idle");
        setStartPoint(null);
        setDistanceFt(0);
        setSelectedDiscId(null);
      } catch (err) {
        setError(String(err));
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-primary w-full text-sm"
      >
        📏 Measure throw
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card p-6 max-w-sm w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-forest-800">Measure throw</h3>
          <button
            onClick={() => setOpen(false)}
            className="text-xs text-forest-400"
          >
            ✕
          </button>
        </div>

        {stage === "idle" && (
          <div className="space-y-3">
            <p className="text-sm text-forest-700">
              Stand at the release point and click "Start GPS"
            </p>
            <button
              onClick={startTracking}
              className="btn-primary w-full"
            >
              📍 Start GPS
            </button>
          </div>
        )}

        {stage === "tracking" && (
          <div className="space-y-4">
            <div className="bg-forest-50 rounded-xl p-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-forest-900">
                  {distanceFt}
                </div>
                <div className="text-sm text-forest-600 mt-2">feet</div>
                {currentPoint && (
                  <div className="text-xs text-forest-500 mt-3">
                    Accuracy: ±{Math.round(currentPoint.accuracy)} ft
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-forest-700 text-center">
              🟢 GPS tracking active. Walk to the landing spot.
            </p>
            <button
              onClick={stopTracking}
              className="btn-primary w-full bg-green-600 hover:bg-green-700"
            >
              ✓ Confirm distance
            </button>
            <button
              onClick={() => {
                if (watchId !== null) {
                  navigator.geolocation.clearWatch(watchId);
                  setWatchId(null);
                }
                setStage("idle");
                setStartPoint(null);
                setCurrentPoint(null);
                setDistanceFt(0);
              }}
              className="btn-secondary w-full text-sm"
            >
              Cancel
            </button>
          </div>
        )}

        {stage === "select-disc" && (
          <div className="space-y-3">
            <p className="text-sm text-forest-700 font-semibold">
              Which disc did you throw? ({distanceFt} ft)
            </p>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {bagDiscs.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDiscId(d.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                    selectedDiscId === d.id
                      ? "border-forest-700 bg-forest-100"
                      : "border-forest-200 hover:bg-forest-50"
                  }`}
                >
                  <div className="font-semibold text-sm text-forest-800">
                    {d.discName}
                  </div>
                  <div className="text-xs text-forest-500">
                    {d.manufacturer} · {d.speed}/{d.glide ?? "—"}/{d.turn ?? "—"}/
                    {d.fade ?? "—"}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={saveThrow}
              disabled={!selectedDiscId || pending}
              className="btn-primary w-full"
            >
              {pending ? "Saving…" : "Save throw"}
            </button>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-700 bg-red-50 p-2 rounded">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
