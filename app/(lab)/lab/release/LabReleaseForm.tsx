"use client";

import { useEffect, useRef, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Technician { id: string; name: string }
interface Part       { id: string; name: string }

type CustomerType = "OCCASIONAL_CUSTOMER" | "CLALIT_ENGINEERING";

const CUSTOMER_LABELS: Record<CustomerType, string> = {
  OCCASIONAL_CUSTOMER: "לקוח מזדמן",
  CLALIT_ENGINEERING:  "כללית הנדסה",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function blankForm() {
  return {
    serialNumber:  "",
    technicianId:  "",
    date:          todayISO(),
    workingHours:  "" as string | number,
    customerType:  "" as CustomerType | "",
  };
}

// ── Main form ─────────────────────────────────────────────────────────────────

interface Props {
  technicians: Technician[];
  parts: Part[];
}

export default function LabReleaseForm({ technicians, parts }: Props) {
  const serialRef = useRef<HTMLInputElement>(null);

  const [form, setForm]               = useState(blankForm);
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());
  const [isInspectionOnly, setIsInspectionOnly] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [successMsg, setSuccessMsg]   = useState("");

  // Auto-focus serial number on mount
  useEffect(() => { serialRef.current?.focus(); }, []);

  // ── Part / inspection-only mutual exclusion ────────────────────────────────

  function togglePart(id: string) {
    setSelectedParts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // Selecting a part clears inspection-only
        setIsInspectionOnly(false);
      }
      return next;
    });
  }

  function toggleInspectionOnly() {
    if (!isInspectionOnly) {
      // Turning on → clear all part selections
      setSelectedParts(new Set());
    }
    setIsInspectionOnly((v) => !v);
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!form.customerType) {
      setError("יש לבחור סוג לקוח");
      return;
    }
    if (!isInspectionOnly && selectedParts.size === 0) {
      setError("יש לבחור לפחות חלק אחד, או לסמן 'בדיקה בלבד'");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/lab/release", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serialNumber:     form.serialNumber.trim(),
        technicianId:     form.technicianId,
        date:             form.date,
        workingHours:     Number(form.workingHours),
        customerType:     form.customerType,
        partIds:          Array.from(selectedParts),
        isInspectionOnly,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "שגיאה בשמירת הרשומה");
      return;
    }

    // Success — reset form, keep technician & date for quick repeat scanning
    const savedTechId = form.technicianId;
    const savedDate   = form.date;
    setForm({ ...blankForm(), technicianId: savedTechId, date: savedDate });
    setSelectedParts(new Set());
    setIsInspectionOnly(false);
    setSuccessMsg(`✅ מס' ${data.serialNumber} נשמר בהצלחה`);
    setTimeout(() => setSuccessMsg(""), 4000);
    serialRef.current?.focus();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const inputBase =
    "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── Serial Number ───────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
          מספר סידורי <span className="text-red-500">*</span>
        </label>
        <input
          ref={serialRef}
          type="text"
          className={inputBase}
          placeholder="סרוק או הקלד מספר סידורי..."
          value={form.serialNumber}
          onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))}
          required
          dir="ltr"
          autoComplete="off"
        />
      </div>

      {/* ── Two-column row: Technician + Date ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
            טכנאי <span className="text-red-500">*</span>
          </label>
          <select
            className={inputBase}
            value={form.technicianId}
            onChange={(e) => setForm((f) => ({ ...f, technicianId: e.target.value }))}
            required
          >
            <option value="" disabled>בחר טכנאי...</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
            תאריך <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            className={inputBase}
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            required
            dir="ltr"
          />
        </div>
      </div>

      {/* ── Working Hours ────────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
          שעות פעולה (מד-חיים) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          className={inputBase}
          placeholder="0"
          min={0}
          max={999999}
          value={form.workingHours}
          onChange={(e) => setForm((f) => ({ ...f, workingHours: e.target.value }))}
          required
          dir="ltr"
        />
      </div>

      {/* ── Customer Type ────────────────────────────────────────────────── */}
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2.5">
          סוג לקוח <span className="text-red-500">*</span>
        </p>
        <div className="flex gap-4 flex-wrap">
          {(["OCCASIONAL_CUSTOMER", "CLALIT_ENGINEERING"] as CustomerType[]).map((ct) => (
            <label
              key={ct}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${
                form.customerType === ct
                  ? "border-teal-500 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
                  : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500"
              }`}
            >
              <input
                type="radio"
                name="customerType"
                value={ct}
                checked={form.customerType === ct}
                onChange={() => setForm((f) => ({ ...f, customerType: ct }))}
                className="hidden"
              />
              <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                form.customerType === ct ? "border-teal-500" : "border-slate-300 dark:border-slate-500"
              }`}>
                {form.customerType === ct && (
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full block" />
                )}
              </span>
              {CUSTOMER_LABELS[ct]}
            </label>
          ))}
        </div>
      </div>

      {/* ── Parts ───────────────────────────────────────────────────────── */}
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-2.5">
          חלקים שהוחלפו / סוג שירות <span className="text-red-500">*</span>
        </p>

        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600 divide-y divide-slate-100 dark:divide-slate-600 overflow-hidden">

          {/* Individual parts */}
          {parts.map((part) => {
            const checked  = selectedParts.has(part.id);
            const disabled = isInspectionOnly;
            return (
              <label
                key={part.id}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                  disabled
                    ? "opacity-40 cursor-not-allowed"
                    : "hover:bg-slate-100 dark:hover:bg-slate-700"
                } ${checked ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => !disabled && togglePart(part.id)}
                  className="w-4 h-4 rounded accent-teal-600"
                />
                <span className={`text-sm ${
                  checked
                    ? "font-semibold text-slate-800 dark:text-slate-100"
                    : "text-slate-600 dark:text-slate-300"
                }`}>
                  {part.name}
                </span>
              </label>
            );
          })}

          {parts.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500 italic">
              אין חלקים — הוסף חלקים בהגדרות מעבדה
            </div>
          )}

          {/* Inspection-only separator */}
          <div className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
            isInspectionOnly
              ? "bg-amber-50 dark:bg-amber-900/20"
              : "hover:bg-slate-100 dark:hover:bg-slate-700"
          }`}
            onClick={toggleInspectionOnly}
          >
            <input
              type="checkbox"
              checked={isInspectionOnly}
              onChange={toggleInspectionOnly}
              className="w-4 h-4 rounded accent-amber-500"
              onClick={(e) => e.stopPropagation()}
            />
            <span className={`text-sm font-semibold ${
              isInspectionOnly
                ? "text-amber-700 dark:text-amber-400"
                : "text-slate-600 dark:text-slate-300"
            }`}>
              🔍 בדיקה בלבד
            </span>
            {isInspectionOnly && (
              <span className="text-xs text-amber-600 dark:text-amber-400 mr-auto">ללא החלפת חלקים</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Error / Success ──────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-xl px-4 py-3">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm rounded-xl px-4 py-3 font-medium">
          {successMsg}
        </div>
      )}

      {/* ── Submit ───────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold py-3 px-4 rounded-xl transition-colors text-sm shadow-sm"
      >
        {loading ? "שומר..." : "שמור רשומה"}
      </button>
    </form>
  );
}
