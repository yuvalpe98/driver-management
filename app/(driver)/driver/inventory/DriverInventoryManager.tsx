"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Item {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minThreshold: number;
}

interface CatalogItem {
  id: string;
  name: string;
  unit: string | null;
  minThreshold: number;
}

interface Props {
  initialItems: Item[];
  availableCatalogItems: CatalogItem[];
}

export default function DriverInventoryManager({ initialItems, availableCatalogItems }: Props) {
  const router = useRouter();

  const [items, setItems] = useState<Item[]>(initialItems);
  const [available, setAvailable] = useState<CatalogItem[]>(availableCatalogItems);

  // Editing existing item
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState(0);

  // Adding new item from catalog
  const [showAdd, setShowAdd] = useState(false);
  const [selectedCatalogId, setSelectedCatalogId] = useState("");
  const [newQty, setNewQty] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lowCount = items.filter((i) => i.minThreshold > 0 && i.quantity <= i.minThreshold).length;
  const selectedCatalog = available.find((c) => c.id === selectedCatalogId);

  // ── Add from catalog ──────────────────────────────────────────────────────

  async function handleAdd() {
    if (!selectedCatalogId) return;
    setError("");
    setLoading(true);

    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ catalogItemId: selectedCatalogId, quantity: newQty }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "שגיאה בהוספת הפריט"); return; }

    // Add to list, remove from available dropdown
    const added: Item = {
      id: data.id,
      name: data.catalogItem.name,
      unit: data.catalogItem.unit ?? "יחידות",
      minThreshold: data.catalogItem.minThreshold ?? 0,
      quantity: data.quantity,
    };
    setItems((prev) => [...prev, added].sort((a, b) => a.name.localeCompare(b.name, "he")));
    setAvailable((prev) => prev.filter((c) => c.id !== selectedCatalogId));
    setSelectedCatalogId(""); setNewQty(0); setShowAdd(false);
    router.refresh();
  }

  // ── Update quantity ───────────────────────────────────────────────────────

  async function handleUpdateQty(id: string) {
    setError("");
    setLoading(true);
    const res = await fetch(`/api/inventory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: editQty }),
    });
    setLoading(false);
    if (!res.ok) { setError("שגיאה בעדכון הכמות"); return; }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: editQty } : i)));
    setEditingId(null);
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete(id: string) {
    setError("");
    setLoading(true);
    const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    setLoading(false);
    if (!res.ok) { setError("שגיאה במחיקת הפריט"); return; }

    const removed = items.find((i) => i.id === id);
    setItems((prev) => prev.filter((i) => i.id !== id));

    // Return the catalog item back to the available dropdown
    // We need the catalogItemId — fetch it from the removed item name via available
    // Since we don't store catalogItemId in state, trigger a full refresh to re-sync
    router.refresh();
    if (removed) {
      // Optimistically restore: we don't have catalogItemId in Item state,
      // so just refresh which will re-fetch available items from server.
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Low stock alert */}
      {lowCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700 font-medium flex items-center gap-2">
          <span>⚠️</span>
          <span>{lowCount} פריטים במלאי נמוך — עדכן את המנהל</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Item list */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
        {items.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-2xl">📦</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">המלאי שלך ריק</p>
            <p className="text-slate-400 dark:text-slate-500 text-xs">
              בחר פריטים מהקטלוג למטה כדי לעדכן את המלאי שלך
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50 dark:divide-slate-700">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                  {item.name}
                </span>

                {editingId === item.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={editQty}
                      onChange={(e) => setEditQty(parseInt(e.target.value) || 0)}
                      className="w-16 text-center border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-1 text-sm bg-white dark:bg-slate-700 dark:text-slate-100"
                      autoFocus
                    />
                    <span className="text-xs text-slate-400">{item.unit}</span>
                    <button
                      onClick={() => handleUpdateQty(item.id)}
                      disabled={loading}
                      className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded-lg disabled:opacity-50 transition-colors"
                    >
                      שמור
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      ביטול
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${item.minThreshold > 0 && item.quantity <= item.minThreshold ? "text-red-600" : "text-slate-800 dark:text-slate-100"}`}>
                      {item.quantity}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{item.unit}</span>
                    {item.minThreshold > 0 && item.quantity <= item.minThreshold && (
                      <span className="text-xs text-red-500 font-medium">נמוך</span>
                    )}
                    <button
                      onClick={() => { setEditingId(item.id); setEditQty(item.quantity); }}
                      className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                    >
                      עריכה
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={loading}
                      className="text-xs text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      הסר
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add from catalog */}
      {available.length === 0 && items.length > 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-1">
          ✅ כל פריטי הקטלוג כבר נמצאים ברשימה שלך
        </p>
      ) : available.length === 0 && items.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl py-6 text-center space-y-1">
          <p className="text-slate-400 dark:text-slate-500 text-sm">הקטלוג ריק</p>
          <p className="text-slate-400 dark:text-slate-500 text-xs">פנה למנהל כדי להוסיף פריטים לקטלוג</p>
        </div>
      ) : showAdd ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">הוסף פריט מהקטלוג</p>
          <div className="flex gap-2">
            <select
              value={selectedCatalogId}
              onChange={(e) => setSelectedCatalogId(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— בחר פריט —</option>
              {available.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.unit ? ` (${c.unit})` : ""}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              value={newQty}
              onChange={(e) => setNewQty(parseInt(e.target.value) || 0)}
              placeholder="כמות"
              className="w-20 text-center px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {selectedCatalog && (
              <span className="self-center text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                {selectedCatalog.unit ?? "יחידות"}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={loading || !selectedCatalogId}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              {loading ? "שומר..." : "הוסף פריט"}
            </button>
            <button
              onClick={() => { setShowAdd(false); setSelectedCatalogId(""); setNewQty(0); setError(""); }}
              className="px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              ביטול
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-dashed border-blue-300 dark:border-blue-700 rounded-2xl py-3 transition-colors"
        >
          + הוסף פריט מהקטלוג
        </button>
      )}
    </div>
  );
}
