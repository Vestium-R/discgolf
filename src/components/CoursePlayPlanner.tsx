"use client";
import { useState, useTransition } from "react";
import { planCourseAction, AI_FACTORS } from "@/app/bag/ai-analyze";
import { COURSES } from "@/components/CourseList";
import { AIFactorsBadge } from "@/components/AIFactorsBadge";

export function CoursePlayPlanner() {
  const [open, setOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [customName, setCustomName] = useState("");
  const [conditions, setConditions] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const courseName = selectedSlug ? selectedName : customName;

  function selectCourse(slug: string, name: string) {
    setSelectedSlug(slug); setSelectedName(name); setCustomName(""); setResult(null);
  }

  function plan() {
    if (!courseName.trim()) return;
    setResult(null); setErr(null);
    startTransition(async () => {
      const res = await planCourseAction(courseName.trim(), conditions.trim(), selectedSlug || undefined);
      if (res.ok) setResult(res.text); else setErr(res.error);
    });
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="btn-secondary w-full text-sm">
      📍 Plan my bag for a course
    </button>
  );

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-forest-800">Course bag planner</h3>
        <button onClick={() => { setOpen(false); setResult(null); }} className="text-xs text-forest-400 hover:text-forest-700">✕</button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">Select a local course</label>
          <select value={selectedSlug}
            onChange={e => {
              const opt = COURSES.flatMap(g => g.courses).find(c => c.slug === e.target.value);
              if (opt) selectCourse(opt.slug, opt.name);
              else { setSelectedSlug(""); setSelectedName(""); }
              setResult(null);
            }}
            className="input-pill text-sm">
            <option value="">— Pick a course —</option>
            {COURSES.filter(g => g.courses.length > 0).map(group => (
              <optgroup key={group.province} label={group.province}>
                {group.courses.map(c => (
                  <option key={c.slug} value={c.slug}>{c.name} ({c.city})</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">
            Or type any course <span className="font-normal text-forest-400">(NS, PEI, or not listed)</span>
          </label>
          <input value={selectedSlug ? selectedName : customName}
            onChange={e => { setSelectedSlug(""); setSelectedName(""); setCustomName(e.target.value); setResult(null); }}
            placeholder="e.g. Victoria Park Disc Golf, Halifax NS"
            className="input-pill text-sm" />
        </div>

        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">Conditions (optional)</label>
          <input value={conditions} onChange={e => setConditions(e.target.value)}
            placeholder="e.g. windy, morning round, tournament"
            className="input-pill text-sm" />
        </div>
      </div>

      <span className="flex items-center gap-1">
        <button onClick={plan} disabled={pending || !courseName.trim()} className="btn-primary flex-1">
          {pending ? "Planning…" : "✨ Plan my bag"}
        </button>
        <AIFactorsBadge factors={AI_FACTORS.coursePlanner} />
      </span>

      {err && <p className="text-sm text-red-700">{err}</p>}

      {pending && (
        <div className="space-y-2 animate-pulse">
          {[1,.9,.75,1,.8].map((w,i) => <div key={i} className="h-3 bg-forest-100 rounded" style={{width:`${w*100}%`}}/>)}
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
