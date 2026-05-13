"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormField, inputClass } from "@/components/ui/FormField";

interface Driver { id: string; name: string }
interface InventoryItem { id: string; name: string; quantity: number; unit: string }
interface TaskItem { name: string; quantity: number }
interface RecommendedDriver {
  id: string;
  name: string;
  hasAllItems: boolean;
  distanceKm: number | null;
  openTaskCount: number;
}

type TaskType = "DELIVERY" | "MAINTENANCE";

export default function NewTaskForm({ drivers }: { drivers: Driver[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("DELIVERY");
  const [form, setForm] = useState({
    title: "",
    description: "",
    deliveryAddress: "",
    assignedDriverId: "",
    scheduledFor: "",
  });

  const [allItemNames, setAllItemNames] = useState<string[]>([]);
  const [driverInventory, setDriverInventory] = useState<InventoryItem[]>([]);
  const [items, setItems] = useState<TaskItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [recommendations, setRecommendations] = useState<RecommendedDriver[]>([]);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch all known item names once for the datalist suggestions
  useEffect(() => {
    fetch("/api/inventory")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const names = [...new Set((data as InventoryItem[]).map((i) => i.name))].sort();
          setAllItemNames(names);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch selected driver's inventory for stock warnings
  useEffect(() => {
    if (!form.assignedDriverId) { setDriverInventory([]); return; }
    fetch(`/api/inventory?driverId=${form.assignedDriverId}`)
      .then((r) => r.json())
      .then((data) => setDriverInventory(Array.isArray(data) ? data : []))
      .catch(() => setDriverInventory([]));
  }, [form.assignedDriverId]);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  const fetchRecommendations = useCallback((address: string, taskItems: TaskItem[]) => {
    if (address.length < 5) { setRecommendations([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setRecommendLoading(true);
      const itemsParam = taskItems.map((i) => `${i.name}:${i.quantity}`).join(",");
      const params = new URLSearchParams({ address });
      if (itemsParam) params.set("items", itemsParam);
      try {
        const res = await fetch(`/api/drivers/recommend?${params}`);
        const data = await res.json();
        setRecommendations(Array.isArray(data) ? data : []);
      } catch {
        setRecommendations([]);
      } finally {
        setRecommendLoading(false);
      }
    }, 600);
  }, []);

  useEffect(() => {
    fetchRecommendations(form.deliveryAddress, items);
  }, [form.deliveryAddress, items, fetchRecommendations]);

  function addItem() {
    const name = newItemName.trim();
    if (!name || newItemQty <= 0) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.name === name);
      if (existing) return prev.map((i) => i.name === name ? { ...i, quantity: i.quantity + newItemQty } : i);
      return [...prev, { name, quantity: newItemQty }];
    });
    setNewItemName("");
    setNewItemQty(1);
  }

  function removeItem(name: string) {
    setItems((prev) => prev.filter((i) => i.name !== name));
  }

  function getAvailable(name: string) {
    return driverInventory.find((i) => i.name === name)?.quantity ?? null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.assignedDriverId) { setError("יש לבחור נהג"); return; }
    setLoading(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        taskType,
        scheduledFor: form.scheduledFor ? new Date(form.scheduledFor).toISOString() : undefined,
        items: taskType === "DELIVERY" && items.length > 0 ? items : undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      if (data.shortages) {
        const detail = (data.shortages as { name: string; requested: number; available: number }[])
          .map((s) => `${s.name}: נדרש ${s.requested}, זמין ${s.available}`).join(" | ");
        setError(`מלאי לא מספיק — ${detail}`);
      } else {
        setError(data.error ?? "שגיאה ביצירת המשימה");
      }
      return;
    }
    router.push("/manager/tasks");
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/manager/tasks" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors text-slate-500">←</Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">משימה חדשה</h1>
          <p className="text-slate-500 text-sm mt-0.5">שבץ משימה לנהג</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Task type toggle */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <p className="text-xs text-slate-400 font-medium mb-3">סוג משימה</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTaskType("DELIVERY")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all ${
                taskType === "DELIVERY"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"
              }`}
            >
              📦 משלוח
            </button>
            <button
              type="button"
              onClick={() => { setTaskType("MAINTENANCE"); setItems([]); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-semibold transition-all ${
                taskType === "MAINTENANCE"
                  ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:border-orange-300"
              }`}
            >
              🔧 תחזוקה
            </button>
          </div>
        </div>

        {/* Basic fields */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
          <FormField label="כותרת המשימה" required>
            <input type="text" className={inputClass} placeholder="משלוח חבילה ל..." value={form.title} onChange={set("title")} required minLength={2} />
          </FormField>
          <FormField label="תיאור">
            <textarea className={`${inputClass} resize-none`} placeholder="פרטים נוספים..." rows={2} value={form.description} onChange={set("description")} />
          </FormField>
          <FormField label="כתובת מסירה" required>
            <input type="text" className={inputClass} placeholder="רחוב, עיר" value={form.deliveryAddress} onChange={set("deliveryAddress")} required minLength={5} />
          </FormField>
          <FormField label="תאריך מתוכנן">
            <input type="datetime-local" className={inputClass} value={form.scheduledFor} onChange={set("scheduledFor")} />
          </FormField>
        </div>

        {/* Delivery items — only for DELIVERY tasks */}
        {taskType === "DELIVERY" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">📦 פריטי משלוח</h3>
              <p className="text-xs text-slate-400 mt-0.5">הוסף את הציוד שיש לספק</p>
            </div>

            <datalist id="item-suggestions">
              {allItemNames.map((n) => <option key={n} value={n} />)}
            </datalist>

            <div className="flex gap-2">
              <input
                type="text"
                list="item-suggestions"
                placeholder="שם הפריט..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <input
                type="number"
                min={1}
                value={newItemQty}
                onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                className="w-20 border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 text-center focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button
                type="button"
                onClick={addItem}
                disabled={!newItemName.trim()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                הוסף
              </button>
            </div>

            {items.length > 0 ? (
              <div className="space-y-2">
                {items.map((item) => {
                  const avail = getAvailable(item.name);
                  const over = avail !== null && item.quantity > avail;
                  return (
                    <div key={item.name} className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm ${over ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-100"}`}>
                      <span className="font-medium text-slate-700">{item.name}</span>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${over ? "text-red-600" : "text-slate-800"}`}>{item.quantity}</span>
                        {over && <span className="text-xs text-red-500">⚠️ חורג ({avail} זמין)</span>}
                        <button type="button" onClick={() => removeItem(item.name)} className="text-slate-400 hover:text-red-500 text-xs">הסר</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-2">לא נוספו פריטים עדיין</p>
            )}
          </div>
        )}

        {/* Driver recommendation */}
        {form.deliveryAddress.length >= 5 && (
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-blue-700 font-semibold text-sm">🤖 המלצת מערכת</span>
              {recommendLoading && <span className="text-xs text-blue-400">מחשב...</span>}
            </div>
            {recommendations.length === 0 && !recommendLoading && (
              <p className="text-xs text-blue-400">אין המלצות — בחר נהג ידנית</p>
            )}
            {recommendations.map((rec) => (
              <button
                key={rec.id}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, assignedDriverId: rec.id }))}
                className={`w-full text-right p-3 rounded-xl border transition-all ${
                  form.assignedDriverId === rec.id ? "border-blue-400 bg-white shadow-sm" : "border-blue-200 bg-white/70 hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 text-sm">{rec.name}</span>
                    {taskType === "DELIVERY" && items.length > 0 && rec.hasAllItems && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ יש כל הפריטים</span>
                    )}
                    {taskType === "DELIVERY" && items.length > 0 && !rec.hasAllItems && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⚠️ חסרים פריטים</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">
                    {rec.distanceKm !== null ? `~${rec.distanceKm.toFixed(1)} ק"מ` : `${rec.openTaskCount} משימות`}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Driver picker */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <FormField label="שבץ לנהג" required>
            <select className={inputClass} value={form.assignedDriverId} onChange={set("assignedDriverId")} required>
              <option value="">— בחר נהג —</option>
              {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </FormField>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm shadow-sm">
            {loading ? "שומר..." : "צור משימה"}
          </button>
          <Link href="/manager/tasks" className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium">
            ביטול
          </Link>
        </div>
      </form>
    </>
  );
}
