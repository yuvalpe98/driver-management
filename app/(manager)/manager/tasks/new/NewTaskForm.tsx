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
  inventoryMatch: { name: string; requested: number; available: number; sufficient: boolean }[];
}

export default function NewTaskForm({ drivers }: { drivers: Driver[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    deliveryAddress: "",
    assignedDriverId: "",
    scheduledFor: "",
  });

  const [driverInventory, setDriverInventory] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [items, setItems] = useState<TaskItem[]>([]);
  const [selectedItemName, setSelectedItemName] = useState("");
  const [selectedItemQty, setSelectedItemQty] = useState(1);
  const [recommendations, setRecommendations] = useState<RecommendedDriver[]>([]);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  useEffect(() => {
    if (!form.assignedDriverId) { setDriverInventory([]); return; }
    setInventoryLoading(true);
    fetch(`/api/inventory?driverId=${form.assignedDriverId}`)
      .then((r) => r.json())
      .then((data) => setDriverInventory(Array.isArray(data) ? data : []))
      .catch(() => setDriverInventory([]))
      .finally(() => setInventoryLoading(false));
  }, [form.assignedDriverId]);

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
    if (!selectedItemName || selectedItemQty <= 0) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.name === selectedItemName);
      if (existing) return prev.map((i) => i.name === selectedItemName ? { ...i, quantity: i.quantity + selectedItemQty } : i);
      return [...prev, { name: selectedItemName, quantity: selectedItemQty }];
    });
    setSelectedItemName("");
    setSelectedItemQty(1);
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
        scheduledFor: form.scheduledFor ? new Date(form.scheduledFor).toISOString() : undefined,
        items: items.length > 0 ? items : undefined,
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
          <p className="text-slate-500 text-sm mt-0.5">שבץ משימת משלוח לנהג</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
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
                    {items.length > 0 && rec.hasAllItems && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✅ יש כל הפריטים</span>}
                    {items.length > 0 && !rec.hasAllItems && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⚠️ חסרים פריטים</span>}
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">
                    {rec.distanceKm !== null ? `~${rec.distanceKm.toFixed(1)} ק"מ` : `${rec.openTaskCount} משימות`}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Driver + item picker */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
          <FormField label="שבץ לנהג" required>
            <select className={inputClass} value={form.assignedDriverId} onChange={set("assignedDriverId")} required>
              <option value="">— בחר נהג —</option>
              {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </FormField>

          {form.assignedDriverId && (
            <div className="space-y-3 pt-2 border-t border-slate-50">
              <p className="text-sm font-semibold text-slate-700">פריטי משלוח</p>
              {inventoryLoading && <p className="text-xs text-slate-400">טוען מלאי...</p>}
              {!inventoryLoading && driverInventory.length === 0 && (
                <p className="text-xs text-slate-400">לנהג זה אין מלאי מוגדר</p>
              )}
              {!inventoryLoading && driverInventory.length > 0 && (
                <div className="flex gap-2">
                  <select
                    value={selectedItemName}
                    onChange={(e) => setSelectedItemName(e.target.value)}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50"
                  >
                    <option value="">— בחר פריט —</option>
                    {driverInventory.map((inv) => (
                      <option key={inv.id} value={inv.name}>{inv.name} (זמין: {inv.quantity} {inv.unit})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={selectedItemQty}
                    onChange={(e) => setSelectedItemQty(parseInt(e.target.value) || 1)}
                    className="w-20 border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 text-center"
                  />
                  <button type="button" onClick={addItem} disabled={!selectedItemName} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-xl transition-colors">
                    הוסף
                  </button>
                </div>
              )}
              {items.length > 0 && (
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
              )}
            </div>
          )}
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
