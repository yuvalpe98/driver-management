"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormField, inputClass } from "@/components/ui/FormField";

interface Driver {
  id: string;
  name: string;
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

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.assignedDriverId) {
      setError("יש לבחור נהג");
      return;
    }

    setLoading(true);

    const body = {
      ...form,
      scheduledFor: form.scheduledFor ? new Date(form.scheduledFor).toISOString() : undefined,
    };

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "שגיאה ביצירת המשימה");
      return;
    }

    router.push("/manager/tasks");
    router.refresh();
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/manager/tasks"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors text-slate-500"
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">משימה חדשה</h1>
          <p className="text-slate-500 text-sm mt-0.5">שבץ משימת משלוח לנהג</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField label="כותרת המשימה" required>
            <input
              type="text"
              className={inputClass}
              placeholder="משלוח חבילה ל..."
              value={form.title}
              onChange={set("title")}
              required
              minLength={2}
            />
          </FormField>

          <FormField label="תיאור">
            <textarea
              className={`${inputClass} resize-none`}
              placeholder="פרטים נוספים על המשלוח..."
              rows={3}
              value={form.description}
              onChange={set("description")}
            />
          </FormField>

          <FormField label="כתובת מסירה" required>
            <input
              type="text"
              className={inputClass}
              placeholder="רחוב, עיר"
              value={form.deliveryAddress}
              onChange={set("deliveryAddress")}
              required
              minLength={5}
            />
          </FormField>

          <FormField label="שבץ לנהג" required>
            <select
              className={inputClass}
              value={form.assignedDriverId}
              onChange={set("assignedDriverId")}
              required
            >
              <option value="">— בחר נהג —</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="תאריך מתוכנן">
            <input
              type="datetime-local"
              className={inputClass}
              value={form.scheduledFor}
              onChange={set("scheduledFor")}
            />
          </FormField>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm shadow-sm"
            >
              {loading ? "שומר..." : "צור משימה"}
            </button>
            <Link
              href="/manager/tasks"
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              ביטול
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
