"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputClass } from "@/components/ui/FormField";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LabEntry {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

type Section = "technicians" | "parts";

// ── Generic CRUD list ─────────────────────────────────────────────────────────

function LabList({
  items,
  apiBase,
  emptyLabel,
  addPlaceholder,
  onChanged,
}: {
  items: LabEntry[];
  apiBase: string;   // e.g. "/api/lab/technicians"
  emptyLabel: string;
  addPlaceholder: string;
  onChanged: (items: LabEntry[]) => void;
}) {
  const [list, setList] = useState<LabEntry[]>(items);
  const [newName, setNewName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // ── Add ──────────────────────────────────────────────────────────────────

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAddLoading(true);

    const res = await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    setAddLoading(false);

    if (!res.ok) { setAddError(data.error ?? "שגיאה"); return; }

    const updated = [data, ...list];
    setList(updated);
    onChanged(updated);
    setNewName("");
  }

  // ── Toggle active ─────────────────────────────────────────────────────────

  async function handleToggle(entry: LabEntry) {
    const res = await fetch(`${apiBase}/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !entry.isActive }),
    });
    if (!res.ok) return;
    const updated = list.map((item) =>
      item.id === entry.id ? { ...item, isActive: !entry.isActive } : item,
    );
    setList(updated);
    onChanged(updated);
  }

  // ── Rename ────────────────────────────────────────────────────────────────

  function startEdit(entry: LabEntry) {
    setEditingId(entry.id);
    setEditName(entry.name);
    setEditError("");
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setEditError("");
    setEditLoading(true);

    const res = await fetch(`${apiBase}/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    const data = await res.json();
    setEditLoading(false);

    if (!res.ok) { setEditError(data.error ?? "שגיאה"); return; }

    const updated = list.map((item) => (item.id === editingId ? data : item));
    setList(updated);
    onChanged(updated);
    setEditingId(null);
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete(entry: LabEntry) {
    if (!confirm(`למחוק את "${entry.name}"?`)) return;

    const res = await fetch(`${apiBase}/${entry.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "שגיאה במחיקה");
      return;
    }
    const updated = list.filter((item) => item.id !== entry.id);
    setList(updated);
    onChanged(updated);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          className={`${inputClass} flex-1`}
          placeholder={addPlaceholder}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          required
          minLength={1}
          maxLength={100}
        />
        <button
          type="submit"
          disabled={addLoading || !newName.trim()}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold rounded-xl transition-colors shrink-0"
        >
          {addLoading ? "..." : "הוסף"}
        </button>
      </form>
      {addError && <p className="text-red-600 text-sm">{addError}</p>}

      {/* List */}
      {list.length === 0 ? (
        <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-sm">{emptyLabel}</div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {list.map((entry) => (
            <div key={entry.id} className="py-3 flex items-center gap-3">
              {editingId === entry.id ? (
                /* Inline rename form */
                <form onSubmit={handleRename} className="flex-1 flex gap-2">
                  <input
                    type="text"
                    className={`${inputClass} flex-1`}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    minLength={1}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    {editLoading ? "..." : "שמור"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    ביטול
                  </button>
                  {editError && <p className="text-red-600 text-xs self-center">{editError}</p>}
                </form>
              ) : (
                /* Normal row */
                <>
                  <span className={`flex-1 text-sm font-medium ${
                    entry.isActive
                      ? "text-slate-800 dark:text-slate-100"
                      : "text-slate-400 dark:text-slate-500 line-through"
                  }`}>
                    {entry.name}
                  </span>

                  {/* Active badge */}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                    entry.isActive
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500"
                  }`}>
                    {entry.isActive ? "פעיל" : "לא פעיל"}
                  </span>

                  {/* Actions */}
                  <button
                    onClick={() => startEdit(entry)}
                    className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="שינוי שם"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleToggle(entry)}
                    className="text-xs text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    title={entry.isActive ? "השבת" : "הפעל"}
                  >
                    {entry.isActive ? "⏸" : "▶"}
                  </button>
                  <button
                    onClick={() => handleDelete(entry)}
                    className="text-xs text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="מחיקה"
                  >
                    🗑
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  technicians: LabEntry[];
  parts: LabEntry[];
}

export default function LabSettingsManager({ technicians: initTechs, parts: initParts }: Props) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>("technicians");
  const [techs, setTechs] = useState<LabEntry[]>(initTechs);
  const [parts, setParts] = useState<LabEntry[]>(initParts);

  const sections: { key: Section; label: string; icon: string; count: number }[] = [
    { key: "technicians", label: "טכנאים",   icon: "👷", count: techs.length },
    { key: "parts",       label: "חלקים",    icon: "🔩", count: parts.length },
  ];

  return (
    <div className="space-y-6">
      {/* Section tabs */}
      <div className="flex gap-2 border-b border-slate-100 dark:border-slate-700 pb-0">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl border-b-2 transition-colors -mb-px ${
              activeSection === s.key
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            <span>{s.icon}</span>
            {s.label}
            <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
              {s.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6">
        {activeSection === "technicians" ? (
          <>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">
              👷 ניהול טכנאים
            </h2>
            <LabList
              items={techs}
              apiBase="/api/lab/technicians"
              emptyLabel="אין טכנאים — הוסף את הראשון"
              addPlaceholder="שם הטכנאי..."
              onChanged={(updated) => { setTechs(updated); router.refresh(); }}
            />
          </>
        ) : (
          <>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">
              🔩 ניהול חלקים
            </h2>
            <LabList
              items={parts}
              apiBase="/api/lab/parts"
              emptyLabel="אין חלקים — הוסף את הראשון"
              addPlaceholder="שם החלק..."
              onChanged={(updated) => { setParts(updated); router.refresh(); }}
            />
          </>
        )}
      </div>
    </div>
  );
}
