"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SignatureCanvas, { SignatureCanvasRef } from "@/components/driver/SignatureCanvas";
import Link from "next/link";

type EquipmentStatus = "GOOD" | "NEEDS_REPAIR" | "MISSING";

interface EquipmentItem {
  id: string;
  name: string;
  status: EquipmentStatus;
}

const statusConfig: Record<EquipmentStatus, { label: string; color: string; icon: string }> = {
  GOOD:         { label: "תקין",        color: "bg-green-100 text-green-700 ring-green-300",   icon: "✅" },
  NEEDS_REPAIR: { label: "דורש תיקון", color: "bg-yellow-100 text-yellow-700 ring-yellow-300", icon: "⚠️" },
  MISSING:      { label: "חסר",         color: "bg-red-100 text-red-700 ring-red-300",          icon: "❌" },
};

const statusCycle: EquipmentStatus[] = ["GOOD", "NEEDS_REPAIR", "MISSING"];

export default function CompleteTaskForm({
  taskId,
  equipment,
}: {
  taskId: string;
  equipment: EquipmentItem[];
}) {
  const router = useRouter();
  const sigRef = useRef<SignatureCanvasRef>(null);

  const [recipientName, setRecipientName] = useState("");
  const [equipmentStatuses, setEquipmentStatuses] = useState<Record<string, EquipmentStatus>>(
    Object.fromEntries(equipment.map((e) => [e.id, e.status]))
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function cycleStatus(id: string) {
    setEquipmentStatuses((prev) => {
      const current = prev[id] ?? "GOOD";
      const next = statusCycle[(statusCycle.indexOf(current) + 1) % statusCycle.length];
      return { ...prev, [id]: next };
    });
  }

  const issueCount = Object.values(equipmentStatuses).filter((s) => s !== "GOOD").length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!recipientName.trim()) {
      setError("יש להזין שם מקבל");
      return;
    }
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setError("יש לצייר חתימה לפני השליחה");
      return;
    }

    setLoading(true);
    const signatureBase64 = sigRef.current.toDataURL();

    // Build equipment updates — only send items whose status changed
    const equipmentUpdates = equipment
      .filter((e) => equipmentStatuses[e.id] !== e.status)
      .map((e) => ({ id: e.id, status: equipmentStatuses[e.id] ?? e.status }));

    const res = await fetch(`/api/tasks/${taskId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientName: recipientName.trim(),
        signatureBase64,
        equipmentUpdates,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "שגיאה בשמירת המשימה");
      return;
    }

    setDone(true);
    setTimeout(() => {
      router.push("/driver/dashboard");
      router.refresh();
    }, 2500);
  }

  if (done) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-20 text-center space-y-3">
        <div className="text-6xl">✅</div>
        <p className="text-xl font-bold text-green-700">המשימה הושלמה בהצלחה!</p>
        {issueCount > 0 && (
          <p className="text-sm text-yellow-600">
            ⚠️ {issueCount} בעיות ציוד דווחו למנהל
          </p>
        )}
        <p className="text-slate-400 text-sm">מועבר ללוח הבקרה...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Back */}
      <Link
        href={`/driver/tasks/${taskId}`}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm"
      >
        <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        חזרה לפרטי המשימה
      </Link>

      {/* Step 1 — Recipient */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold shrink-0">1</span>
          <h2 className="font-bold text-slate-800">פרטי מסירה</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            שם המקבל <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="ישראל ישראלי"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-base"
          />
        </div>
      </div>

      {/* Step 2 — Equipment check */}
      {equipment.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold shrink-0">2</span>
              <h2 className="font-bold text-slate-800">בדיקת ציוד</h2>
            </div>
            {issueCount > 0 && (
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                {issueCount} בעיות
              </span>
            )}
          </div>
          <p className="text-slate-400 text-xs">לחץ על הסטטוס כדי לשנות. המנהל יראה את העדכון.</p>

          <ul className="space-y-2">
            {equipment.map((item) => {
              const status = equipmentStatuses[item.id] ?? item.status;
              const cfg = statusConfig[status];
              const changed = status !== item.status;
              return (
                <li
                  key={item.id}
                  className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-colors ${
                    changed ? "border-blue-200 bg-blue-50/40" : "border-slate-100 bg-slate-50"
                  }`}
                >
                  <span className="text-sm font-medium text-slate-700 flex-1">{item.name}</span>
                  <button
                    type="button"
                    onClick={() => cycleStatus(item.id)}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ring-1 ring-inset transition-all ${cfg.color}`}
                  >
                    <span>{cfg.icon}</span>
                    <span>{cfg.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Step 3 — Signature */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold shrink-0">
              {equipment.length > 0 ? "3" : "2"}
            </span>
            <h2 className="font-bold text-slate-800">חתימת מקבל</h2>
          </div>
          <button
            type="button"
            onClick={() => sigRef.current?.clear()}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors px-3 py-1 rounded-lg hover:bg-slate-100"
          >
            נקה
          </button>
        </div>
        <div
          className="border-2 border-dashed border-slate-200 rounded-xl overflow-hidden bg-white"
          style={{ height: "200px" }}
        >
          <SignatureCanvas ref={sigRef} />
        </div>
        <p className="text-xs text-slate-400 text-center">חתמו באצבע או בעכבר בתוך המלבן</p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-4 rounded-2xl shadow-sm transition-colors text-base"
      >
        {loading ? "שומר..." : "✅ אשר מסירה וסיים משימה"}
      </button>
    </form>
  );
}
