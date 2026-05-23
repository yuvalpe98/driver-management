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

interface CatalogItem {
  id: string;
  name: string;
}

interface Props {
  initialItems: EquipmentItem[];
  availableCatalogItems: CatalogItem[];
}

const statusConfig: Record<EquipmentStatus, { label: string; color: string; icon: string }> = {
  GOOD:         { label: "תקין",        color: "bg-green-100 text-green-700",   icon: "✅" },
  NEEDS_REPAIR: { label: "דורש תיקון", color: "bg-yellow-100 text-yellow-700", icon: "⚠️" },
  MISSING:      { label: "חסר",         color: "bg-red-100 text-red-700",       icon: "❌" },
};

const statusCycle: EquipmentStatus[] = ["GOOD", "NEEDS_REPAIR", "MISSING"];

// ── Status cycle button ───────────────────────────────────────────────────────

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
    const next = statusCycle[(statusCycle.indexOf(currentStatus) + 1) % statusCycle.length] as EquipmentStatus;
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

// ── Main component ────────────────────────────────────────────────────────────

export default function EquipmentList({ initialItems, availableCatalogItems }: Props) {
  const router = useRouter();

  const [items, setItems] = useState<EquipmentItem[]>(initialItems);
  const [available, setAvailable] = useState<CatalogItem[]>(availableCatalogItems);

  const [showAdd, setShowAdd] = useState(false);
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  const good    = items.filter((i) => i.status === "GOOD").length;
  const repair  = items.filter((i) => i.status === "NEEDS_REPAIR").length;
  const missing = items.filter((i) => i.status === "MISSING").length;

  function updateStatus(id: string, status: EquipmentStatus) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCatalogId) return;
    setAddError("");
    setAdding(true);

    const res = await fetch("/api/equipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catalogItemId: selectedCatalogId }),
    });

    const data = await res.json();
    setAdding(false);

    if (!res.ok) { setAddError(data.error ?? "שגיאה"); return; }

    // Add to list with the name from the catalog
    const catalogEntry = available.find((c) => c.id === selectedCatalogId);
    const newItem: EquipmentItem = {
      id: data.id,
      name: data.catalogItem?.name ?? catalogEntry?.name ?? "",
      status: "GOOD",
      notes: null,
      updatedAt: new Date(),
    };

    setItems((prev) =>
      [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name, "he"))
    );
    setAvailable((prev) => prev.filter((c) => c.id !== selectedCatalogId));
    setSelectedCatalogId(""); setShowAdd(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("להסיר פריט זה מהרשימה?")) return;
    await fetch(`/api/equipment/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
    // Refresh to restore item to the available dropdown
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
          <p className="text-green-700 dark:text-green-400 text-xl font-bold">{good}</p>
          <p className="text-green-600 dark:text-green-500 text-xs mt-0.5">תקין</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-3 text-center">
          <p className="text-yellow-700 dark:text-yellow-400 text-xl font-bold">{repair}</p>
          <p className="text-yellow-600 dark:text-yellow-500 text-xs mt-0.5">דורש תיקון</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center">
          <p className="text-red-700 dark:text-red-400 text-xl font-bold">{missing}</p>
          <p className="text-red-600 dark:text-red-500 text-xs mt-0.5">חסר</p>
        </div>
      </div>

      {/* Equipment list */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">
            פריטי ציוד ({items.length})
          </h2>
          {available.length > 0 && (
            <button
              onClick={() => setShowAdd((v) => !v)}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1"
            >
              {showAdd ? "ביטול" : "+ הוסף פריט"}
            </button>
          )}
        </div>

        {/* Add form — catalog dropdown */}
        {showAdd && (
          <form
            onSubmit={handleAdd}
            className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex gap-2 flex-wrap"
          >
            <select
              value={selectedCatalogId}
              onChange={(e) => setSelectedCatalogId(e.target.value)}
              className="flex-1 min-w-40 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            >
              <option value="">— בחר פריט ציוד —</option>
              {available.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={adding || !selectedCatalogId}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {adding ? "..." : "הוסף"}
            </button>
            {addError && (
              <p className="w-full text-red-500 text-xs mt-1">{addError}</p>
            )}
          </form>
        )}

        {/* Empty states */}
        {items.length === 0 && !showAdd && (
          available.length === 0 ? (
            <div className="py-12 text-center space-y-1">
              <p className="text-slate-400 dark:text-slate-500 text-sm">הקטלוג ריק</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs">פנה למנהל להוספת פריטי ציוד לקטלוג</p>
            </div>
          ) : (
            <div className="py-12 text-center space-y-2">
              <p className="text-2xl">🔧</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">אין ציוד ברשימה</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs">לחץ על &quot;הוסף פריט&quot; למעלה כדי לבחור מהקטלוג</p>
            </div>
          )
        )}

        {/* Item list */}
        {items.length > 0 && (
          <ul className="divide-y divide-slate-50 dark:divide-slate-700">
            {items.map((item) => (
              <li key={item.id} className="px-5 py-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 dark:text-slate-100 text-sm">{item.name}</p>
                  {item.notes && (
                    <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">{item.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusButton
                    itemId={item.id}
                    currentStatus={item.status}
                    onUpdate={updateStatus}
                  />
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-slate-300 hover:text-red-400 dark:text-slate-600 dark:hover:text-red-400 transition-colors p-1"
                    title="הסר"
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

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
        לחץ על הסטטוס כדי לשנות: תקין → דורש תיקון → חסר
      </p>
    </div>
  );
}
