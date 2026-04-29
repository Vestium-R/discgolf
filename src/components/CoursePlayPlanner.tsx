"use client";
import { useState, useTransition } from "react";
import { planCourseAction } from "@/app/bag/ai-analyze";

export function CoursePlayPlanner() {
  const [open, setOpen] = useState(false);
  const [course, setCourse] = useState("");
  const [conditions, setConditions] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function plan() {
    if (!course.trim()) return;
    setResult(null);
    setErr(null);
    startTransition(async () => {
      const res = await planCourseAction(course.trim(), conditions.trim());
      if (res.ok) setResult(res.text);
      else setErr(res.error);
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary w-full text-sm">
        📍 Plan my bag for a course
      </button>
    );
  }

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-forest-800">Course bag planner</h3>
        <button onClick={() => { setOpen(false); setResult(null); }} className="text-xs text-forest-400 hover:text-forest-700">✕</button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">Course name</label>
          <input
            value={course}
            onChange={(e) => { setCourse(e.target.value); setResult(null); }}
            placeholder="e.g. Hillcrest Disc Golf"
            className="input-pill text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">Conditions (optional)</label>
          <input
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            placeholder="e.g. windy, wooded, playing in the morning"
            className="input-pill text-sm"
          />
        </div>
      </div>

      <button onClick={plan} disabled={pending || !course.trim()}
        className="btn-primary w-full">
        {pending ? "Planning…" : "✨ Plan my bag"}
      </button>

      {err && <p className="text-sm text-red-700">{err}</p>}

      {pending && (
        <div className="space-y-2 animate-pulse">
          <div className="h-3 bg-forest-100 rounded w-full" />
          <div className="h-3 bg-forest-100 rounded w-5/6" />
          <div className="h-3 bg-forest-100 rounded w-4/6" />
          <div className="h-3 bg-forest-100 rounded w-full" />
          <div className="h-3 bg-forest-100 rounded w-3/4" />
        </div>
      )}

      {result && (
        <div className="rounded-xl bg-forest-50 border border-forest-100 p-3 space-y-1.5">
          {result.split("\n").filter(Boolean).map((line, i) => (
            <p key={i} className="text-sm text-forest-800 leading-relaxed">{line}</p>
          ))}
        </div>
      )}
    </div>
  );
}
