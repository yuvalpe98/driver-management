"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelTaskButton({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  async function handleCancel() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "שגיאה");
      setConfirming(false);
      return;
    }
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-3">
        <p className="text-sm text-slate-600 flex-1">בטוח לבטל את המשימה?</p>
        <button
          onClick={() => setConfirming(false)}
          className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          לא
        </button>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 px-4 py-1.5 rounded-lg transition-colors"
        >
          {loading ? "מבטל..." : "כן, בטל"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setConfirming(true)}
        className="text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors border border-red-200"
      >
        ביטול משימה
      </button>
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}
