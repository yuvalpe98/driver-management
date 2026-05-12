"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type EquipmentStatus = "GOOD" | "NEEDS_REPAIR" | "MISSING";

interface EquipmentItem {
  id: string;
  name: string;
  status: EquipmentStatus;
  notes: string | null;
  updatedAt: string | Date;
}

const statusConfig = {
  GOOD:         { label: "תקין",        color: "bg-green-100 text-green-700",  icon: "✅" },
  NEEDS_REPAIR: { label: "דורש תיקון", color: "bg-yellow-100 text-yellow-700", icon: "⚠️" },
  MISSING:      { label: "חסר",         color: "bg-red-100 text-red-700",      icon: "❌" },
};

const statusCycle: EquipmentStatus[] = ["GOOD", "NEEDS_REPAIR", "MISSING"];

function StatusButton({
  itemId,
  currentStatus,
  onUpdate,
}: {
  itemId: string;
  currentStatus: EquipmentStatus;
  onUpdate: (id: string, status: EquipmentStatus) => void;
}) {
  const [loading, setLoading] = useState(false);

  async function cycle() {
    const next = statusCycle[(statusCycle.indexOf(currentStatus) + 1) % statusCycle.length];
    setLoading(true);
    const res = await fetch(`/api/equipment/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    if (res.ok) onUpdate(itemId, next);
  }

  const cfg = statusConfig[currentStatus];
  return (
    <button
      onClick={cycle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-opacity disabled:opacity-50 ${cfg.color}`}
    >
      {loading ? "..." : <><span>{cfg.icon}</span><span>{cfg.label}</span></>}
    </button>
  );
}

export default function EquipmentList({ initialItems }: { initialItems: EquipmentItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<EquipmentItem[]>(initialItems);
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  function updateStatus(id: string, status: EquipmentStatus) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAdding(true);

    const res = await fetch("/api/equipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });

    const data = await res.json();
    setAdding(false);

    if (!res.ok) { setAddError(data.error); return; }

    setItems((prev) => [...prev, { ...data, notes: null, updatedAt: new Date() }].sort((a, b) => a.name.localeCompare(b.name, "he")));
    setNewName("");
    setShowAdd(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("למחוק פריט זה מהרשימה?")) return;
    await fetch(`/api/equipment/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const good    = items.filter((i) => i.status === "GOOD").length;
  const repair  = items.filter((i) => i.status === "NEEDS_REPAIR").length;
  const missing = items.filter((i) => i.status === "MISSING").length;

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-green-700 text-xl font-bold">{good}</p>
          <p className="text-green-600 text-xs mt-0.5">תקין</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-3 text-center">
          <p className="text-yellow-700 text-xl font-bold">{repair}</p>
          <p className="text-yellow-600 text-xs mt-0.5">דורש תיקון</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <p className="text-red-700 text-xl font-bold">{missing}</p>
          <p className="text-red-600 text-xs mt-0.5">חסר</p>
        </div>
      </div>

      {/* Equipment list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">פריטי ציוד ({items.length})</h2>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            {showAdd ? "ביטול" : "+ הוסף פריט"}
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <form onSubmit={handleAdd} className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="שם הציוד החדש..."
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={2}
            />
            <button
              type="submit"
              disabled={adding}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
            >
              {adding ? "..." : "הוסף"}
            </button>
            {addError && <p className="text-red-500 text-xs self-center">{addError}</p>}
          </form>
        )}

        {items.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">אין פריטי ציוד ברשימה</div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {items.map((item) => (
              <li key={item.id} className="px-5 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 text-sm">{item.name}</p>
                  {item.notes && <p className="text-slate-400 text-xs mt-0.5">{item.notes}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusButton
                    itemId={item.id}
                    currentStatus={item.status}
                    onUpdate={updateStatus}
                  />
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-slate-300 hover:text-red-400 transition-colors p-1"
                    title="מחק"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-slate-400 text-center">
        לחץ על הסטטוס כדי לשנות: תקין → דורש תיקון → חסר
      </p>
    </div>
  );
}
