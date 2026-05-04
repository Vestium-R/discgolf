"use client";

import { useState, useEffect } from "react";
import { auditUserBagDiscs, auditAllBagDiscs, fixBagDiscFlightNumbers, updateDiscInDatabase, addDiscToDatabase, getRosterForAudit } from "@/app/admin/audit-discs-action";
import type { DiscMismatch } from "@/lib/disc-audit";
import { DISC_DB } from "@/lib/discs-db";

type AuditResult = Awaited<ReturnType<typeof auditUserBagDiscs>>;

export function AuditPage() {
  const [userId, setUserId] = useState("");
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [auditMode, setAuditMode] = useState<"user" | "all">("user");
  const [editorOpen, setEditorOpen] = useState(false);
  const [roster, setRoster] = useState<Array<{ id: string; name: string }>>([]);
  const [rosterLoading, setRosterLoading] = useState(true);

  useEffect(() => {
    getRosterForAudit()
      .then(setRoster)
      .catch((error) => console.error("Failed to load roster:", error))
      .finally(() => setRosterLoading(false));
  }, []);

  async function handleAudit() {
    setLoading(true);
    try {
      const result =
        auditMode === "user" && userId
          ? await auditUserBagDiscs(userId)
          : await auditAllBagDiscs();
      setAuditResult(result);
    } catch (error) {
      alert(`Audit failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleFixMismatch(mismatch: DiscMismatch) {
    if (!mismatch.dbDisc) {
      throw new Error(`Cannot auto-fix: ${mismatch.bagDisc.disc_name} not in database`);
    }

    await fixBagDiscFlightNumbers(mismatch.bagDisc.id, mismatch.dbDisc);
  }

  async function handleFixAll() {
    if (!auditResult?.mismatches.length) return;

    const fixable = auditResult.mismatches.filter((m) => m.dbDisc !== null);
    if (!fixable.length) {
      alert("No fixable mismatches (all not-found)");
      return;
    }

    if (!confirm(`Fix ${fixable.length} mismatches?`)) return;

    setFixing(true);
    try {
      let fixed = 0;
      let failed = 0;
      for (const mismatch of fixable) {
        try {
          await handleFixMismatch(mismatch);
          fixed++;
        } catch (error) {
          failed++;
        }
      }
      await handleAudit();
      if (failed > 0) {
        alert(`Fixed ${fixed}, failed ${failed}`);
      }
    } catch (error) {
      alert(`Batch fix failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setFixing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-blue-800">Disc Database Editor</h2>
          <button
            onClick={() => setEditorOpen(!editorOpen)}
            className="text-sm bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-800"
          >
            {editorOpen ? "Hide" : "Show"} Editor
          </button>
        </div>
        {editorOpen && <DiscEditor />}
      </div>

      <div className="rounded-lg bg-forest-50 border border-forest-200 p-4 space-y-3">
        <h2 className="font-semibold text-forest-800">Disc Flight Number Audit</h2>

        <div className="flex gap-2">
          <button
            onClick={() => setAuditMode("user")}
            className={`px-3 py-1 rounded text-sm ${
              auditMode === "user"
                ? "bg-forest-700 text-white"
                : "bg-white border border-forest-300 text-forest-700"
            }`}
          >
            Audit User
          </button>
          <button
            onClick={() => setAuditMode("all")}
            className={`px-3 py-1 rounded text-sm ${
              auditMode === "all"
                ? "bg-forest-700 text-white"
                : "bg-white border border-forest-300 text-forest-700"
            }`}
          >
            Audit All
          </button>
        </div>

        {auditMode === "user" && (
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="input-pill text-sm w-full"
            disabled={rosterLoading}
          >
            <option value="">— Select a player —</option>
            {roster.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
        )}

        <button onClick={handleAudit} disabled={loading} className="btn-primary w-full">
          {loading ? "Auditing..." : "Run Audit"}
        </button>
      </div>

      {auditResult && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="text-xs text-blue-600 font-semibold">Total Discs</div>
              <div className="text-lg font-bold text-blue-900">{auditResult.totalBagDiscs}</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <div className="text-xs text-red-600 font-semibold">Mismatches</div>
              <div className="text-lg font-bold text-red-900">{auditResult.summary.totalMismatches}</div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded p-3">
              <div className="text-xs text-orange-600 font-semibold">Not Found</div>
              <div className="text-lg font-bold text-orange-900">{auditResult.summary.notFound}</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <div className="text-xs text-green-600 font-semibold">Flight Mismatches</div>
              <div className="text-lg font-bold text-green-900">{auditResult.summary.flightNumberMismatches}</div>
            </div>
          </div>

          {auditResult.summary.flightNumberMismatches > 0 && (
            <button onClick={handleFixAll} disabled={fixing} className="btn-primary w-full">
              {fixing ? "Fixing..." : `Fix All Flight Numbers (${auditResult.mismatches.filter((m) => m.dbDisc).length})`}
            </button>
          )}

          {auditResult.mismatches.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded p-4 text-green-700 text-center">
              ✓ All discs match database flight numbers!
            </div>
          ) : (
            <div className="space-y-2">
              {auditResult.mismatches.map((mismatch, i) => (
                <MismatchRow
                  key={i}
                  mismatch={mismatch}
                  onFix={async () => {
                    try {
                      await handleFixMismatch(mismatch);
                      await handleAudit();
                    } catch (error) {
                      alert(`Fix failed: ${error instanceof Error ? error.message : "Unknown error"}`);
                    }
                  }}
                  fixing={fixing}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MismatchRow({
  mismatch,
  onFix,
  fixing,
}: {
  mismatch: DiscMismatch;
  onFix: () => void;
  fixing: boolean;
}) {
  const { bagDisc, dbDisc, mismatchType, expected } = mismatch;

  if (mismatchType === "not_found") {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-3">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-semibold text-red-900">
              {bagDisc.disc_name} ({bagDisc.manufacturer})
            </div>
            <div className="text-xs text-red-700">NOT FOUND in database</div>
            <div className="text-xs text-red-600 mt-1">
              {bagDisc.speed}/{bagDisc.glide}/{bagDisc.turn}/{bagDisc.fade}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-orange-50 border border-orange-200 rounded p-3">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="font-semibold text-orange-900">
            {bagDisc.disc_name} ({bagDisc.manufacturer})
          </div>
          <div className="text-xs text-orange-700 mt-1">
            <div>
              Stored: {bagDisc.speed}/{bagDisc.glide}/{bagDisc.turn}/{bagDisc.fade}
            </div>
            <div>
              DB: {dbDisc?.speed}/{dbDisc?.glide}/{dbDisc?.turn}/{dbDisc?.fade}
            </div>
          </div>
          <div className="text-xs font-semibold text-orange-800 mt-1">
            Mismatch: {mismatchType}
            {expected && ` (should be ${expected[mismatchType as keyof typeof expected]})`}
          </div>
        </div>
        <button
          onClick={onFix}
          disabled={fixing || !dbDisc}
          className="btn-primary text-xs px-2 py-1 whitespace-nowrap ml-2"
        >
          {fixing ? "..." : "Fix"}
        </button>
      </div>
    </div>
  );
}

function DiscEditor() {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<typeof DISC_DB>([]);
  const [editing, setEditing] = useState<(typeof DISC_DB)[0] | null>(null);
  const [adding, setAdding] = useState(false);

  function handleSearch(query: string) {
    setSearch(query);
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const filtered = DISC_DB.filter(
      (d) =>
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.manufacturer.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered.slice(0, 20));
  }

  if (editing) {
    return (
      <DiscEditorForm
        disc={editing}
        onCancel={() => setEditing(null)}
        onSave={(updated) => {
          alert(`Disc updated: ${updated.name}`);
          setEditing(null);
        }}
      />
    );
  }

  if (adding) {
    return (
      <DiscAddForm
        onCancel={() => setAdding(false)}
        onSave={(newDisc) => {
          alert(`Disc added: ${newDisc.name}`);
          setAdding(false);
          setSearch("");
          setResults([]);
        }}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search discs by name or manufacturer..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="input-pill text-sm flex-1"
        />
        <button
          onClick={() => setAdding(true)}
          className="btn-primary text-sm px-3 whitespace-nowrap"
        >
          + Add Disc
        </button>
      </div>
      {results.length > 0 && (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {results.map((disc, i) => (
            <div key={i} className="flex justify-between items-center bg-white border border-gray-200 p-2 rounded text-sm">
              <div>
                <span className="font-semibold">{disc.name}</span>
                <span className="text-gray-600 ml-2">{disc.manufacturer}</span>
                <span className="text-gray-500 ml-2">{disc.speed}/{disc.glide}/{disc.turn}/{disc.fade}</span>
              </div>
              <button
                onClick={() => setEditing(disc)}
                className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-200 rounded"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      )}
      {search.length >= 2 && results.length === 0 && (
        <div className="text-sm text-gray-600">No discs found</div>
      )}
    </div>
  );
}

function DiscEditorForm({
  disc,
  onCancel,
  onSave,
}: {
  disc: typeof DISC_DB[0];
  onCancel: () => void;
  onSave: (disc: typeof DISC_DB[0]) => void;
}) {
  const [formData, setFormData] = useState(disc);
  const [saving, setSaving] = useState(false);

  function handleChange(key: string, value: string | number) {
    setFormData({ ...formData, [key]: value });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateDiscInDatabase(formData);
      alert(`Disc saved: ${formData.name}`);
      onSave(formData);
    } catch (error) {
      alert(`Save failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-blue-300 rounded p-4 space-y-3">
      <div className="font-semibold text-blue-900">Edit Disc</div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-700">Manufacturer</label>
          <input
            type="text"
            value={formData.manufacturer}
            onChange={(e) => handleChange("manufacturer", e.target.value)}
            className="input-pill text-sm w-full"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="input-pill text-sm w-full"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700">Type</label>
          <select
            value={formData.type}
            onChange={(e) => handleChange("type", e.target.value)}
            className="input-pill text-sm w-full"
          >
            <option value="putter">Putter</option>
            <option value="midrange">Midrange</option>
            <option value="fairway_driver">Fairway Driver</option>
            <option value="distance_driver">Distance Driver</option>
          </select>
        </div>
        <div className="col-span-2 grid grid-cols-4 gap-2">
          <div>
            <label className="text-xs font-semibold text-gray-700">Speed</label>
            <input
              type="number"
              value={formData.speed}
              onChange={(e) => handleChange("speed", parseFloat(e.target.value))}
              className="input-pill text-sm w-full"
              step="0.5"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">Glide</label>
            <input
              type="number"
              value={formData.glide}
              onChange={(e) => handleChange("glide", parseFloat(e.target.value))}
              className="input-pill text-sm w-full"
              step="0.5"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">Turn</label>
            <input
              type="number"
              value={formData.turn}
              onChange={(e) => handleChange("turn", parseFloat(e.target.value))}
              className="input-pill text-sm w-full"
              step="0.5"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">Fade</label>
            <input
              type="number"
              value={formData.fade}
              onChange={(e) => handleChange("fade", parseFloat(e.target.value))}
              className="input-pill text-sm w-full"
              step="0.5"
            />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving} className="btn-primary text-sm flex-1">
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function DiscAddForm({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (disc: typeof DISC_DB[0]) => void;
}) {
  const [formData, setFormData] = useState({
    manufacturer: "",
    name: "",
    type: "putter" as const,
    speed: 2,
    glide: 3,
    turn: 0,
    fade: 1,
  });
  const [saving, setSaving] = useState(false);

  function handleChange(key: string, value: string | number) {
    setFormData({ ...formData, [key]: value });
  }

  async function handleSave() {
    if (!formData.manufacturer.trim() || !formData.name.trim()) {
      alert("Manufacturer and name are required");
      return;
    }

    setSaving(true);
    try {
      await addDiscToDatabase(formData);
      onSave(formData);
    } catch (error) {
      alert(`Save failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-green-300 rounded p-4 space-y-3">
      <div className="font-semibold text-green-900">Add New Disc</div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-700">Manufacturer *</label>
          <input
            type="text"
            value={formData.manufacturer}
            onChange={(e) => handleChange("manufacturer", e.target.value)}
            className="input-pill text-sm w-full"
            placeholder="e.g. Innova"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700">Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="input-pill text-sm w-full"
            placeholder="e.g. Aviar"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700">Type</label>
          <select
            value={formData.type}
            onChange={(e) => handleChange("type", e.target.value)}
            className="input-pill text-sm w-full"
          >
            <option value="putter">Putter</option>
            <option value="midrange">Midrange</option>
            <option value="fairway_driver">Fairway Driver</option>
            <option value="distance_driver">Distance Driver</option>
          </select>
        </div>
        <div className="col-span-2 grid grid-cols-4 gap-2">
          <div>
            <label className="text-xs font-semibold text-gray-700">Speed</label>
            <input
              type="number"
              value={formData.speed}
              onChange={(e) => handleChange("speed", parseFloat(e.target.value))}
              className="input-pill text-sm w-full"
              step="0.5"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">Glide</label>
            <input
              type="number"
              value={formData.glide}
              onChange={(e) => handleChange("glide", parseFloat(e.target.value))}
              className="input-pill text-sm w-full"
              step="0.5"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">Turn</label>
            <input
              type="number"
              value={formData.turn}
              onChange={(e) => handleChange("turn", parseFloat(e.target.value))}
              className="input-pill text-sm w-full"
              step="0.5"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">Fade</label>
            <input
              type="number"
              value={formData.fade}
              onChange={(e) => handleChange("fade", parseFloat(e.target.value))}
              className="input-pill text-sm w-full"
              step="0.5"
            />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={saving} className="btn-primary text-sm flex-1">
          {saving ? "Adding..." : "Add Disc"}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
