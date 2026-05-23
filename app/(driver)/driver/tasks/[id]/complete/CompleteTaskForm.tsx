"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import SignatureCanvas, { SignatureCanvasRef } from "@/components/driver/SignatureCanvas";
import Link from "next/link";

// BarcodeScanner uses @zxing WASM — load client-only to avoid SSR issues
const BarcodeScanner = dynamic(() => import("@/components/ui/BarcodeScanner"), { ssr: false });

// ─────────────────────────────────────────────────────────────────────────────

interface TaskItem {
  id: string;
  name: string;
  quantity: number;
}

// ── Per-item serial block ─────────────────────────────────────────────────────

function ItemSerialBlock({
  item,
  serials,
  isActiveScan,
  onToggleScan,
  onAddSerial,
  onRemoveSerial,
}: {
  item: TaskItem;
  serials: string[];
  isActiveScan: boolean;
  onToggleScan: () => void;
  onAddSerial: (serial: string) => "ok" | "duplicate" | "full";
  onRemoveSerial: (serial: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [manualValue, setManualValue] = useState("");
  const [inputError, setInputError] = useState("");

  const filled = serials.length;
  const required = item.quantity;
  const complete = filled >= required;

  function tryAdd(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const result = onAddSerial(trimmed);
    if (result === "ok") {
      setManualValue("");
      setInputError("");
      // Keep focus for rapid-fire entry
      setTimeout(() => inputRef.current?.focus(), 30);
    } else if (result === "duplicate") {
      setInputError("מספר סידורי זה כבר קיים");
    } else {
      setInputError("הכמות הנדרשת כבר מולאה");
    }
  }

  function handleScan(code: string) {
    // duplicates / full are silently ignored — scanner keeps running
    onAddSerial(code);
  }

  return (
    <div className={`rounded-2xl border p-4 space-y-3 transition-colors ${
      complete
        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
        : "bg-slate-50 dark:bg-slate-700/40 border-slate-100 dark:border-slate-600"
    }`}>

      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-tight">{item.name}</p>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
          complete
            ? "bg-green-600 text-white"
            : filled > 0
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
            : "bg-slate-200 text-slate-500 dark:bg-slate-600 dark:text-slate-400"
        }`}>
          {filled}/{required}
        </span>
      </div>

      {/* Scanned list */}
      {serials.length > 0 && (
        <ul className="space-y-1">
          {serials.map((sn) => (
            <li key={sn} className="flex items-center justify-between gap-2 bg-white dark:bg-slate-700 rounded-lg px-3 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <span className="font-mono text-xs text-slate-700 dark:text-slate-200 truncate">{sn}</span>
              <button
                type="button"
                onClick={() => onRemoveSerial(sn)}
                className="text-slate-300 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors shrink-0"
                aria-label="הסר"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Input area — hidden once complete */}
      {!complete ? (
        <>
          {isActiveScan ? (
            <BarcodeScanner onScan={handleScan} onClose={onToggleScan} />
          ) : (
            <div className="flex gap-2">
              {/* Manual text input */}
              <input
                ref={inputRef}
                type="text"
                inputMode="text"
                value={manualValue}
                onChange={(e) => { setManualValue(e.target.value); setInputError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); tryAdd(manualValue); } }}
                placeholder="הזן מ.ס ואשר ב-Enter"
                className="flex-1 min-w-0 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => tryAdd(manualValue)}
                disabled={!manualValue.trim()}
                className="px-3 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-600 disabled:text-slate-400 text-white text-xs font-bold rounded-xl transition-colors shrink-0"
              >
                הוסף
              </button>
              {/* Camera toggle */}
              <button
                type="button"
                onClick={onToggleScan}
                className="px-3 py-2.5 bg-slate-100 hover:bg-blue-50 dark:bg-slate-600 dark:hover:bg-blue-900/30 hover:border-blue-300 text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-semibold rounded-xl transition-colors shrink-0 flex items-center gap-1"
                title="פתח מצלמה לסריקה"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0" />
                </svg>
                <span className="hidden xs:inline">סרוק</span>
              </button>
            </div>
          )}

          {inputError && (
            <p className="text-xs text-red-500 dark:text-red-400">{inputError}</p>
          )}
        </>
      ) : (
        <p className="text-xs text-green-600 dark:text-green-400 font-semibold">✅ כל הסריאלים נוספו</p>
      )}
    </div>
  );
}

// ── Main form ─────────────────────────────────────────────────────────────────

export default function CompleteTaskForm({
  taskId,
  taskItems,
}: {
  taskId: string;
  taskItems: TaskItem[];
}) {
  const router = useRouter();
  const sigRef = useRef<SignatureCanvasRef>(null);

  const [recipientName, setRecipientName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // serialsByItem: Record<taskItemId, scannedSerial[]>
  const [serialsByItem, setSerialsByItem] = useState<Record<string, string[]>>(
    () => Object.fromEntries(taskItems.map((i) => [i.id, []]))
  );

  // At most one camera scanner open at a time
  const [activeScannerItemId, setActiveScannerItemId] = useState<string | null>(null);

  const hasItems = taskItems.length > 0;

  // All serials currently assigned — used for cross-item duplicate detection
  const allUsedSerials = new Set(Object.values(serialsByItem).flat());

  const completedItemCount = taskItems.filter(
    (i) => (serialsByItem[i.id]?.length ?? 0) >= i.quantity
  ).length;
  const allSerialsComplete = !hasItems || completedItemCount === taskItems.length;

  // Dynamic step number for the signature card
  const sigStepNum = hasItems ? 3 : 2;

  // ── Serial management ────────────────────────────────────────────────────────

  function addSerial(itemId: string, serial: string): "ok" | "duplicate" | "full" {
    const item = taskItems.find((i) => i.id === itemId);
    if (!item) return "duplicate";
    const current = serialsByItem[itemId] ?? [];
    if (current.length >= item.quantity) return "full";
    if (allUsedSerials.has(serial)) return "duplicate";

    setSerialsByItem((prev) => ({
      ...prev,
      [itemId]: [...(prev[itemId] ?? []), serial],
    }));

    // Auto-close scanner when this item reaches its quota
    if (current.length + 1 >= item.quantity) {
      setActiveScannerItemId(null);
    }
    return "ok";
  }

  function removeSerial(itemId: string, serial: string) {
    setSerialsByItem((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] ?? []).filter((s) => s !== serial),
    }));
  }

  function toggleScanner(itemId: string) {
    setActiveScannerItemId((prev) => (prev === itemId ? null : itemId));
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!recipientName.trim()) { setError("יש להזין שם מקבל"); return; }
    if (hasItems && !allSerialsComplete) { setError("יש להזין את כל מספרי הסידורי לפני השליחה"); return; }
    if (!sigRef.current || sigRef.current.isEmpty()) { setError("יש לצייר חתימה לפני השליחה"); return; }

    setLoading(true);
    const signatureBase64 = sigRef.current.toDataURL();

    const serials = hasItems
      ? taskItems.map((item) => ({
          taskItemId: item.id,
          serials: serialsByItem[item.id] ?? [],
        }))
      : undefined;

    const res = await fetch(`/api/tasks/${taskId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientName: recipientName.trim(), signatureBase64, serials }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (data.duplicates) {
        setError(`מספרי סידורי כבר קיימים במערכת: ${(data.duplicates as string[]).join(", ")}`);
      } else if (data.mismatches) {
        const detail = (data.mismatches as { name: string; required: number; provided: number }[])
          .map((m) => `${m.name}: נדרש ${m.required}, סופק ${m.provided}`)
          .join(" | ");
        setError(`כמות סריאלים שגויה — ${detail}`);
      } else {
        setError(data.error ?? "שגיאה בשמירת המשימה");
      }
      return;
    }

    setDone(true);
    setTimeout(() => { router.push("/driver/dashboard"); router.refresh(); }, 2500);
  }

  // ── Success screen ───────────────────────────────────────────────────────────

  if (done) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm py-20 text-center space-y-3">
        <div className="text-6xl">✅</div>
        <p className="text-xl font-bold text-green-700 dark:text-green-400">המשימה הושלמה בהצלחה!</p>
        <p className="text-slate-400 dark:text-slate-500 text-sm">מועבר ללוח הבקרה...</p>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Back link */}
      <Link
        href={`/driver/tasks/${taskId}`}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm transition-colors"
      >
        <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        חזרה לפרטי המשימה
      </Link>

      {/* ── Step 1: Recipient ────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold shrink-0">1</span>
          <h2 className="font-bold text-slate-800 dark:text-slate-100">פרטי מסירה</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
            שם המקבל <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="ישראל ישראלי"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-base"
          />
        </div>
      </div>

      {/* ── Step 2: Serial numbers (delivery tasks only) ─────────────────────── */}
      {hasItems && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold shrink-0">2</span>
              <h2 className="font-bold text-slate-800 dark:text-slate-100">מספרי סידורי</h2>
            </div>
            {allSerialsComplete ? (
              <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2.5 py-1 rounded-full">
                ✅ הושלם
              </span>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {completedItemCount}/{taskItems.length} פריטים הושלמו
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            לכל פריט — סרוק ברקוד עם המצלמה או הזן מספר סידורי ידנית (Enter להוספה מהירה)
          </p>

          <div className="space-y-3">
            {taskItems.map((item) => (
              <ItemSerialBlock
                key={item.id}
                item={item}
                serials={serialsByItem[item.id] ?? []}
                isActiveScan={activeScannerItemId === item.id}
                onToggleScan={() => toggleScanner(item.id)}
                onAddSerial={(serial) => addSerial(item.id, serial)}
                onRemoveSerial={(serial) => removeSerial(item.id, serial)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Step 3/2: Signature ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center font-bold shrink-0">
              {sigStepNum}
            </span>
            <h2 className="font-bold text-slate-800 dark:text-slate-100">חתימת מקבל</h2>
          </div>
          <button
            type="button"
            onClick={() => sigRef.current?.clear()}
            className="text-sm text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 px-3 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            נקה
          </button>
        </div>
        <div
          className="border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden bg-white dark:bg-slate-900"
          style={{ height: "200px" }}
        >
          <SignatureCanvas ref={sigRef} />
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">חתמו באצבע או בעכבר בתוך המלבן</p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3">
          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {/* Submit — disabled until all serials are in */}
      <button
        type="submit"
        disabled={loading || (hasItems && !allSerialsComplete)}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white disabled:text-slate-400 dark:disabled:text-slate-500 font-bold py-4 rounded-2xl shadow-sm transition-colors text-base"
      >
        {loading
          ? "שומר..."
          : hasItems && !allSerialsComplete
          ? `⏳ ממתין לסריאלים — ${completedItemCount}/${taskItems.length} פריטים הושלמו`
          : "✅ אשר מסירה וסיים משימה"}
      </button>
    </form>
  );
}
