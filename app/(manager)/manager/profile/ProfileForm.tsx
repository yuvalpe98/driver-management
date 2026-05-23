"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormField, inputClass } from "@/components/ui/FormField";

interface Props {
  name: string;
  phone: string | null;
}

export default function ProfileForm({ name, phone }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name,
    phone: phone ?? "",
    password: "",
  });

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    const body: Record<string, string> = {
      name: form.name,
      phone: form.phone.trim(),
    };
    if (form.password) body["password"] = form.password;

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "שגיאה בשמירת הפרופיל");
      return;
    }

    setSuccess(true);
    setForm((prev) => ({ ...prev, password: "" }));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 space-y-5">

        <FormField label="שם">
          <input
            type="text"
            className={inputClass}
            value={form.name}
            onChange={set("name")}
            required
            minLength={2}
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
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1.5 flex items-center gap-1">
            <span>💬</span>
            <span>מספר זה ישמש לקבלת עדכוני WhatsApp כאשר נהג מסיים משימה</span>
          </p>
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

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
          <span>✅</span>
          <span>הפרופיל עודכן בהצלחה</span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm shadow-sm"
      >
        {loading ? "שומר..." : "שמור שינויים"}
      </button>
    </form>
  );
}
