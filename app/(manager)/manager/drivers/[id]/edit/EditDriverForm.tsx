"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormField, inputClass } from "@/components/ui/FormField";

interface Driver {
  id: string;
  name: string;
  username: string;
  phone: string | null;
}

export default function EditDriverForm({ driver }: { driver: Driver }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: driver.name,
    username: driver.username,
    phone: driver.phone ?? "",
    password: "",
  });

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const body: Record<string, string> = {
      name: form.name,
      username: form.username,
    };
    if (form.phone.trim()) body["phone"] = form.phone.trim();
    else body["phone"] = "";
    if (form.password) body["password"] = form.password;

    const res = await fetch(`/api/drivers/${driver.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "שגיאה בעדכון הנהג");
      return;
    }

    router.push(`/manager/drivers/${driver.id}`);
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/manager/drivers/${driver.id}`}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors text-slate-500"
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">עריכת פרטי נהג</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{driver.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 space-y-5">
          <FormField label="שם" required>
            <input
              type="text"
              className={inputClass}
              value={form.name}
              onChange={set("name")}
              required
              minLength={2}
            />
          </FormField>

          <FormField label="שם משתמש" required>
            <input
              type="text"
              className={inputClass}
              value={form.username}
              onChange={set("username")}
              required
              minLength={2}
              maxLength={50}
              pattern="[a-zA-Z0-9]+"
              title="אותיות ומספרים בלבד"
            />
          </FormField>

          <FormField label="טלפון">
            <input
              type="tel"
              className={inputClass}
              placeholder="050-0000000"
              value={form.phone}
              onChange={set("phone")}
            />
          </FormField>

          <FormField label="סיסמה חדשה">
            <input
              type="password"
              className={inputClass}
              placeholder="השאר ריק לאי-שינוי"
              value={form.password}
              onChange={set("password")}
              minLength={form.password ? 8 : undefined}
            />
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
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm shadow-sm"
          >
            {loading ? "שומר..." : "שמור שינויים"}
          </button>
          <Link
            href={`/manager/drivers/${driver.id}`}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            ביטול
          </Link>
        </div>
      </form>
    </>
  );
}
