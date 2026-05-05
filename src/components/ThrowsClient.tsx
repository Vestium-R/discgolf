"use client";
import { useState, useCallback } from "react";
import type { DiscThrow } from "@/lib/store";
import type { AuthUserId } from "@/lib/id-validation";
import { prettyDate } from "@/lib/format";

export function ThrowsClient({
  initialThrows,
  userId,
}: {
  initialThrows: DiscThrow[];
  userId: AuthUserId;
}) {
  const [throws, setThrows] = useState(initialThrows);
  const [minDist, setMinDist] = useState("");
  const [maxDist, setMaxDist] = useState("");
  const [selectedDisc, setSelectedDisc] = useState("");
  const [course, setCourse] = useState("");

  const uniqueDiscs = Array.from(
    new Map(throws.map((t) => [t.bagDiscId, t])).values()
  ).sort((a, b) => a.discName.localeCompare(b.discName));

  const uniqueCourses = Array.from(
    new Set(throws.map((t) => t.courseName).filter(Boolean))
  ).sort();

  const filtered = throws.filter((t) => {
    if (selectedDisc && t.bagDiscId !== selectedDisc) return false;
    if (minDist && t.distanceFt < Number(minDist)) return false;
    if (maxDist && t.distanceFt > Number(maxDist)) return false;
    if (course && t.courseName !== course) return false;
    return true;
  });

  const stats = {
    totalThrows: filtered.length,
    avgDistance: filtered.length > 0 ? Math.round(filtered.reduce((sum, t) => sum + t.distanceFt, 0) / filtered.length) : 0,
    bestThrow: filtered.length > 0 ? Math.max(...filtered.map((t) => t.distanceFt)) : 0,
    worstThrow: filtered.length > 0 ? Math.min(...filtered.map((t) => t.distanceFt)) : 0,
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card p-4 space-y-4">
        <h3 className="font-semibold text-forest-800">Filters</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs text-forest-600 block mb-1">Disc</label>
            <select
              value={selectedDisc}
              onChange={(e) => setSelectedDisc(e.target.value)}
              className="input-pill w-full text-sm"
            >
              <option value="">All discs</option>
              {uniqueDiscs.map((t) => (
                <option key={t.bagDiscId} value={t.bagDiscId}>
                  {t.discName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-forest-600 block mb-1">Min distance (ft)</label>
            <input
              type="number"
              value={minDist}
              onChange={(e) => setMinDist(e.target.value)}
              placeholder="0"
              className="input-pill w-full text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-forest-600 block mb-1">Max distance (ft)</label>
            <input
              type="number"
              value={maxDist}
              onChange={(e) => setMaxDist(e.target.value)}
              placeholder="1000"
              className="input-pill w-full text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-forest-600 block mb-1">Course</label>
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="input-pill w-full text-sm"
            >
              <option value="">All courses</option>
              {uniqueCourses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats summary */}
      {filtered.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: "Throws", value: stats.totalThrows },
            { label: "Avg distance", value: `${stats.avgDistance} ft` },
            { label: "Best", value: `${stats.bestThrow} ft` },
            { label: "Worst", value: `${stats.worstThrow} ft` },
          ].map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <div className="text-2xl font-bold text-forest-800">{s.value}</div>
              <div className="text-xs text-forest-600">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Throws list */}
      {filtered.length === 0 ? (
        <div className="card p-8 text-center text-forest-500">
          <p className="text-lg">No throws match your filters.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-forest-50 border-b border-forest-100">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-forest-700">Date</th>
                  <th className="px-4 py-2 text-left font-semibold text-forest-700">Disc</th>
                  <th className="px-4 py-2 text-right font-semibold text-forest-700">Distance</th>
                  <th className="px-4 py-2 text-left font-semibold text-forest-700">Course</th>
                  <th className="px-4 py-2 text-left font-semibold text-forest-700">Hole</th>
                  <th className="px-4 py-2 text-left font-semibold text-forest-700">Wind</th>
                  <th className="px-4 py-2 text-left font-semibold text-forest-700">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-50">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-forest-50">
                    <td className="px-4 py-2 text-forest-600 text-xs">{prettyDate(t.createdAt)}</td>
                    <td className="px-4 py-2">
                      <div className="font-medium text-forest-800">{t.discName}</div>
                      {t.manufacturer && <div className="text-xs text-forest-500">{t.manufacturer}</div>}
                    </td>
                    <td className="px-4 py-2 text-right font-mono font-semibold text-forest-800">
                      {t.distanceFt} ft
                    </td>
                    <td className="px-4 py-2 text-sm text-forest-700">{t.courseName || "—"}</td>
                    <td className="px-4 py-2 text-sm text-forest-700">{t.holeNumber || "—"}</td>
                    <td className="px-4 py-2 text-xs text-forest-600">
                      {t.windMph ? `${t.windMph} mph` : "—"}
                    </td>
                    <td className="px-4 py-2 text-xs text-forest-600 italic">{t.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
