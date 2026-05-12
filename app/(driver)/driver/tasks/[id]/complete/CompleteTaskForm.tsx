"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import SignatureCanvas, { SignatureCanvasRef } from "@/components/driver/SignatureCanvas";
import Link from "next/link";

export default function CompleteTaskForm({ taskId }: { taskId: string }) {
  const router = useRouter();
  const sigRef = useRef<SignatureCanvasRef>(null);
  const [recipientName, setRecipientName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

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

    const res = await fetch(`/api/tasks/${taskId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientName: recipientName.trim(), signatureBase64 }),
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
    }, 2000);
  }

  if (done) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-20 text-center space-y-3">
        <div className="text-6xl">✅</div>
        <p className="text-xl font-bold text-green-700">המשימה הושלמה בהצלחה!</p>
        <p className="text-slate-400 text-sm">מועבר ללוח הבקרה...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Back link */}
      <Link
        href={`/driver/tasks/${taskId}`}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm"
      >
        <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        חזרה לפרטי המשימה
      </Link>

      {/* Recipient name */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-slate-800 text-lg">פרטי מסירה</h2>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            שם המקבל <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="ישראל ישראלי"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-base"
            required
          />
        </div>
      </div>

      {/* Signature */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-lg">חתימת מקבל</h2>
          <button
            type="button"
            onClick={() => sigRef.current?.clear()}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors px-3 py-1 rounded-lg hover:bg-slate-100"
          >
            נקה חתימה
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
