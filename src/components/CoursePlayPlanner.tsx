"use client";
import { useState, useTransition } from "react";
import { planCourseAction } from "@/app/bag/ai-analyze";

// Confirmed slugs from UDisc — verified via udisc.com searches
const COURSES: { province: string; courses: { name: string; city: string; slug: string }[] }[] = [
  {
    province: "NB — Greater Moncton / Southeast",
    courses: [
      { name: "CDT Disc Golf Course",          city: "Riverview",        slug: "cdt-disc-golf-course-aywp" },
      { name: "Dieppe DGC",                    city: "Dieppe",           slug: "dieppe-dgc-BDhY" },
      { name: "RHS Tricky Trail",              city: "Riverview",        slug: "rhs-tricky-trail-DNKZ" },
      { name: "Disque Golf Memramcook",        city: "Memramcook",       slug: "disque-golf-memramcook-qLFD" },
      { name: "École Mathieu-Martin",          city: "Dieppe",           slug: "ecole-mathieu-martin-8tur" },
      { name: "Hillsborough Disc Golf",        city: "Hillsborough",     slug: "hillsborough-disc-golf-course-ojJ2" },
      { name: "Beech Hill Park",              city: "Sackville",        slug: "beech-hill-park-disc-golf-course-wuGf" },
      { name: "Cap-Acadie Disc Golf",          city: "Beaubassin East",  slug: "cap-acadie-disc-golf-EIpY" },
      { name: "Maple Park Future Forest",      city: "Petitcodiac",      slug: "maple-park-future-forest-course-n3eW" },
      { name: "Notre Centre",                  city: "Grande-Digue",     slug: "notre-centre-aX4R" },
      { name: "Port Elgin Regional School",    city: "Port Elgin",       slug: "port-elgin-regional-school-dgc-rq91" },
      { name: "Cambridge-Narrows DGC",         city: "Cambridge-Narrows",slug: "cambridge-narrows-dgc-FsLW" },
    ],
  },
  {
    province: "NS — Halifax / Valley",
    courses: [
      { name: "Hammonds Plains Disc Golf",     city: "Hammonds Plains",  slug: "hammonds-plains-disc-golf-JNwi" },
      { name: "Dartmouth Commons DGC",         city: "Dartmouth",        slug: "dartmouth-commons-disc-golf-course-OrIl" },
      { name: "Bennett Park DGC",             city: "Mineville",        slug: "bennett-park-disc-golf-course-2oY4" },
      { name: "Prospect Road CC",             city: "Hatchet Lake",     slug: "prospect-road-community-centre-30FR" },
      { name: "Blandford Community Centre",   city: "Hubbards",         slug: "blandford-community-centre-hgqF" },
      { name: "The Links - New Minas",        city: "New Minas",        slug: "the-links-new-minas-nova-scotia-aqx0" },
      { name: "Ravenwood DiscGolfPark",       city: "Kingston",         slug: "ravenwood-disc-golf-park-course-kingston-u6Uj" },
      { name: "HMCC Disc Golf",               city: "Hantsport",        slug: "hmcc-disc-golf-course-K7N8" },
      { name: "Old Orchard Inn",              city: "Wolfville Ridge",  slug: "old-orchard-inn-9qw8" },
      { name: "Clifton Estate Disc Golf",     city: "Windsor",          slug: "clifton-estate-disc-golf-windsor-ns-FV7E" },
      { name: "Ontree Disc Golf Park",        city: "Windsor",          slug: "ontree-disc-golf-park-MbM8" },
      { name: "Waterville DGC",              city: "Waterville",       slug: "waterville-disc-golf-course-5VkN" },
      { name: "MARC Lunenburg",              city: "Dayspring",        slug: "marc-lunenburg-5B7M" },
      { name: "Deerfield Disc Golf",         city: "South Ohio",       slug: "deerfield-disc-golf-nrdB" },
      { name: "Forest Heights",              city: "Chester Basin",    slug: "forest-heights-chester-0m4k" },
    ],
  },
  {
    province: "NS — Northern / Cape Breton",
    courses: [
      { name: "Bible Hill",                  city: "Truro",            slug: "bible-hill-d1sS" },
      { name: "Keppoch Mountain",            city: "Antigonish",       slug: "keppoch-mountain-2246" },
      { name: "Tiny Changes Disc Golf",      city: "Westchester Stn",  slug: "tiny-changes-disc-golf-FRHk" },
      { name: "Wallace River Winter",        city: "Wallace",          slug: "wallace-river-winter-course-5cLe" },
      { name: "NRHS Disc Golf",             city: "Westville",        slug: "nrhs-disc-golf-course-LE82" },
      { name: "SCA Wolves DGC",            city: "Brookfield",       slug: "sca-wolves-disc-golf-course-wd08" },
      { name: "Sunset DGC",               city: "Pugwash",          slug: "sunset-dgc-jIDl" },
      { name: "2 Rivers Disc Golf",        city: "Huntington",       slug: "2-rivers-disc-golf-Y9lY" },
      { name: "Ski Wentworth Blue",        city: "Wentworth",        slug: "ski-wentworth-blue-course-SzTy" },
      { name: "Ski Wentworth Red",         city: "Wentworth",        slug: "ski-wentworth-red-course-4E97" },
      { name: "Rotary Park DGC",          city: "Sydney",           slug: "rotary-park-dgc-LuAW" },
      { name: "Colliery Lands DGC",       city: "New Waterford",    slug: "colliery-lands-disc-golf-Ifa4" },
      { name: "Cape Breton University",   city: "Sydney",           slug: "cape-breton-university-disc-golf-park-X2lL" },
    ],
  },
  {
    province: "PEI",
    courses: [
      { name: "Raider Disc Golf",          city: "Charlottetown",    slug: "raider-disc-golf-4yI5" },
      { name: "Mulberry Park",            city: "Charlottetown",    slug: "mulberry-park-back-corner-9IXy" },
      { name: "Stratford Town Hall",      city: "Stratford",        slug: "stratford-town-hall-mmp0" },
      { name: "Pondside Park",           city: "Stratford",        slug: "pondside-park-Wicg" },
      { name: "The Fox Hole",            city: "Cornwall",         slug: "the-fox-hole-F0x5" },
      { name: "The Three Rivers DGC",    city: "Georgetown",       slug: "the-three-rivers-dgc-0Gvy" },
      { name: "Mill River DGC",         city: "Bloomfield",       slug: "mill-river-disc-golf-course-Fhbi" },
    ],
  },
];

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
    setSelectedSlug(slug);
    setSelectedName(name);
    setCustomName("");
    setResult(null);
  }

  function plan() {
    if (!courseName.trim()) return;
    setResult(null);
    setErr(null);
    startTransition(async () => {
      const res = await planCourseAction(
        courseName.trim(),
        conditions.trim(),
        selectedSlug || undefined,
      );
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
        {/* Province-grouped course dropdown */}
        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">Select a local course</label>
          <select
            value={selectedSlug}
            onChange={(e) => {
              const opt = COURSES.flatMap(g => g.courses).find(c => c.slug === e.target.value);
              if (opt) selectCourse(opt.slug, opt.name);
              else { setSelectedSlug(""); setSelectedName(""); }
              setResult(null);
            }}
            className="input-pill text-sm"
          >
            <option value="">— Pick a course —</option>
            {COURSES.filter(g => g.courses.length > 0).map((group) => (
              <optgroup key={group.province} label={group.province}>
                {group.courses.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name} ({c.city})</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Manual entry for NS/PEI/unlisted */}
        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">
            Or type any course name <span className="font-normal text-forest-400">(NS, PEI, or not listed above)</span>
          </label>
          <input
            value={selectedSlug ? selectedName : customName}
            onChange={(e) => {
              setSelectedSlug("");
              setSelectedName("");
              setCustomName(e.target.value);
              setResult(null);
            }}
            placeholder="e.g. Victoria Park Disc Golf, Halifax NS"
            className="input-pill text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-forest-700 block mb-1">Conditions (optional)</label>
          <input
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            placeholder="e.g. windy, morning round, tournament"
            className="input-pill text-sm"
          />
        </div>
      </div>

      <button onClick={plan} disabled={pending || !courseName.trim()}
        className="btn-primary w-full">
        {pending ? "Planning…" : "✨ Plan my bag"}
      </button>

      {err && <p className="text-sm text-red-700">{err}</p>}

      {pending && (
        <div className="space-y-2 animate-pulse">
          {[1, 0.9, 0.75, 1, 0.8].map((w, i) => (
            <div key={i} className="h-3 bg-forest-100 rounded" style={{ width: `${w * 100}%` }} />
          ))}
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
