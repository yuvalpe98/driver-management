"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Item {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  updatedAt: string;
}

interface Props {
  driverId: string;
  initialItems: Item[];
}

export default function InventoryManager({ driverId, initialItems }: Props) {
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
      body: JSON.stringify({ driverId, name: newName.trim(), quantity: newQty, unit: newUnit }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "שגיאה");
      return;
    }
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

  return (
    <div className="space-y-3">
      {items.length === 0 && !adding && (
        <p className="text-slate-400 text-sm text-center py-4">אין פריטים במלאי</p>
      )}

      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600">
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
              <span className="text-xs text-slate-500">{item.unit}</span>
              <button
                onClick={() => handleUpdateQty(item.id)}
                disabled={loading}
                className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded-lg transition-colors"
              >
                שמור
              </button>
              <button
                onClick={() => setEditingId(null)}
                className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
              >
                ביטול
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className={`text-sm font-bold ${item.quantity <= 2 ? "text-red-600" : "text-slate-800"}`}>
                {item.quantity}
              </span>
              <span className="text-xs text-slate-400">{item.unit}</span>
              {item.quantity <= 2 && <span className="text-xs text-red-500">⚠️ מלאי נמוך</span>}
              <button
                onClick={() => { setEditingId(item.id); setEditQty(item.quantity); }}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                עריכה
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                מחק
              </button>
            </div>
          )}
        </div>
      ))}

      {adding ? (
        <div className="border border-blue-200 bg-blue-50 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-slate-700">פריט חדש</p>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              placeholder="שם הפריט"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="col-span-3 border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
            />
            <input
              type="number"
              min={0}
              placeholder="כמות"
              value={newQty}
              onChange={(e) => setNewQty(parseInt(e.target.value) || 0)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
            />
            <input
              type="text"
              placeholder="יחידה"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
            />
            <button
              onClick={handleAdd}
              disabled={loading || !newName.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg px-3 py-2 transition-colors"
            >
              הוסף
            </button>
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button onClick={() => { setAdding(false); setError(""); }} className="text-xs text-slate-500">ביטול</button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full text-sm font-medium text-blue-600 hover:bg-blue-50 border border-dashed border-blue-300 rounded-xl py-2.5 transition-colors"
        >
          + הוסף פריט
        </button>
      )}
    </div>
  );
}
