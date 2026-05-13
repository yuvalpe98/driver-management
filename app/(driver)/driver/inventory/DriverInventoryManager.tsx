"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Item {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export default function DriverInventoryManager({ initialItems }: { initialItems: Item[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState(0);
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState(0);
  const [newUnit, setNewUnit] = useState("יחידות");
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd() {
    if (!newName.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), quantity: newQty, unit: newUnit }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "שגיאה");
      return;
    }
    const created = await res.json();
    setItems((prev) => [...prev, created]);
    setNewName(""); setNewQty(0); setNewUnit("יחידות"); setAdding(false);
    router.refresh();
  }

  async function handleUpdateQty(id: string) {
    setLoading(true);
    await fetch(`/api/inventory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: editQty }),
    });
    setLoading(false);
    setEditingId(null);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: editQty } : i)));
  }

  async function handleDelete(id: string) {
    setLoading(true);
    await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    setLoading(false);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const lowCount = items.filter((i) => i.quantity <= 2).length;

  return (
    <div className="space-y-4">
      {/* Low stock alert */}
      {lowCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700 font-medium">
          ⚠️ {lowCount} פריטים במלאי נמוך — עדכן את המנהל
        </div>
      )}

      {/* Item list */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
        {items.length === 0 && !adding && (
          <p className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">המלאי שלך ריק</p>
        )}
        {items.length > 0 && (
          <div className="divide-y divide-slate-50 dark:divide-slate-700">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
                {editingId === item.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={editQty}
                      onChange={(e) => setEditQty(parseInt(e.target.value) || 0)}
                      className="w-16 text-center border border-slate-300 rounded-lg px-2 py-1 text-sm"
                    />
                    <span className="text-xs text-slate-400">{item.unit}</span>
                    <button
                      onClick={() => handleUpdateQty(item.id)}
                      disabled={loading}
                      className="text-xs font-semibold text-white bg-blue-600 px-2.5 py-1 rounded-lg"
                    >
                      שמור
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-xs text-slate-400">ביטול</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${item.quantity <= 2 ? "text-red-600" : "text-slate-800"}`}>
                      {item.quantity}
                    </span>
                    <span className="text-xs text-slate-400">{item.unit}</span>
                    <button
                      onClick={() => { setEditingId(item.id); setEditQty(item.quantity); }}
                      className="text-xs text-blue-600 font-medium"
                    >
                      עריכה
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="text-xs text-red-500">מחק</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add form */}
      {adding ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-3">
          <p className="text-sm font-semibold text-slate-700">פריט חדש</p>
          <input
            type="text"
            placeholder="שם הפריט (למשל: מסכת חמצן)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50"
          />
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              placeholder="כמות"
              value={newQty}
              onChange={(e) => setNewQty(parseInt(e.target.value) || 0)}
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50"
            />
            <input
              type="text"
              placeholder="יחידה"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-slate-50"
            />
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={loading || !newName.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              {loading ? "שומר..." : "הוסף פריט"}
            </button>
            <button
              onClick={() => { setAdding(false); setError(""); }}
              className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600"
            >
              ביטול
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full text-sm font-medium text-blue-600 hover:bg-blue-50 border border-dashed border-blue-300 rounded-2xl py-3 transition-colors"
        >
          + הוסף פריט למלאי
        </button>
      )}
    </div>
  );
}
