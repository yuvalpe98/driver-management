"use client";

import { useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LogEntry {
  id: string;
  serialNumber: string;
  date: string;          // ISO string
  workingHours: number;
  airPurity: number | null;
  customerType: "OCCASIONAL_CUSTOMER" | "CLALIT_ENGINEERING";
  isInspectionOnly: boolean;
  technician: { name: string };
  parts: { name: string }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const CUSTOMER_LABELS = {
  OCCASIONAL_CUSTOMER: "לקוח מזדמן",
  CLALIT_ENGINEERING:  "כללית הנדסה",
};

const CUSTOMER_BADGE: Record<string, string> = {
  CLALIT_ENGINEERING:  "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  OCCASIONAL_CUSTOMER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("he-IL"),
    time: d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
  };
}

// ── Serial History Drawer ─────────────────────────────────────────────────────

function SerialHistoryDrawer({
  serial,
  history,
  loading,
  error,
  onClose,
}: {
  serial: string;
  history: LogEntry[];
  loading: boolean;
  error: string;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside className="fixed inset-y-0 left-0 z-50 w-full sm:w-[420px] bg-white dark:bg-slate-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">היסטוריית שירות</p>
            <span
              className="font-mono text-sm font-semibold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 px-2.5 py-0.5 rounded-lg inline-block"
              dir="ltr"
            >
              {serial}
            </span>
          </div>
          {!loading && (
            <span className="text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-2.5 py-1 rounded-full font-medium shrink-0">
              {history.length} שירותים
            </span>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0 text-lg"
            aria-label="סגור"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40 gap-3 text-slate-400">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-sm">טוען...</span>
            </div>
          ) : error ? (
            <div className="p-5 text-sm text-red-600 dark:text-red-400">{error}</div>
          ) : history.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <p className="text-3xl">🔎</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm">לא נמצאו שירותים למ.ס זה</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {history.map((log, idx) => {
                const { date, time } = fmtDate(log.date);
                return (
                  <div key={log.id} className="px-5 py-4 space-y-2.5">
                    {/* Entry number + date */}
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500 w-5 shrink-0">
                        #{history.length - idx}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 rounded-full">
                        {date} · {time}
                      </span>
                    </div>

                    {/* Detail row */}
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600 dark:text-slate-300 pr-7">
                      <span>👷 {log.technician.name}</span>
                      <span>⏱ {log.workingHours.toLocaleString()} שעות</span>
                      {log.airPurity != null && (
                        <span>💨 {log.airPurity}%</span>
                      )}
                    </div>

                    {/* Badges row */}
                    <div className="flex flex-wrap gap-2 pr-7">
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${CUSTOMER_BADGE[log.customerType]}`}>
                        {CUSTOMER_LABELS[log.customerType as keyof typeof CUSTOMER_LABELS]}
                      </span>
                      {log.isInspectionOnly ? (
                        <span className="text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-0.5 rounded-full">
                          🔍 בדיקה בלבד
                        </span>
                      ) : (
                        log.parts.map((p) => (
                          <span
                            key={p.name}
                            className="text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full"
                          >
                            {p.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LabReportLog({ logs }: { logs: LogEntry[] }) {
  const [search, setSearch] = useState("");

  // Serial history drawer state
  const [selectedSerial, setSelectedSerial] = useState<string | null>(null);
  const [history, setHistory]               = useState<LogEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError]     = useState("");

  async function openHistory(serial: string) {
    setSelectedSerial(serial);
    setHistory([]);
    setHistoryError("");
    setHistoryLoading(true);

    try {
      const res = await fetch(`/api/lab/history?serial=${encodeURIComponent(serial)}`);
      const data = await res.json();
      if (!res.ok) {
        setHistoryError(data.error ?? "שגיאה בטעינת ההיסטוריה");
      } else {
        setHistory(data);
      }
    } catch {
      setHistoryError("שגיאת רשת");
    } finally {
      setHistoryLoading(false);
    }
  }

  function closeHistory() {
    setSelectedSerial(null);
    setHistory([]);
    setHistoryError("");
  }

  const filtered = search.trim()
    ? logs.filter((log) => {
        const q = search.trim().toLowerCase();
        return (
          log.serialNumber.toLowerCase().includes(q) ||
          log.technician.name.toLowerCase().includes(q) ||
          CUSTOMER_LABELS[log.customerType].toLowerCase().includes(q) ||
          log.parts.some((p) => p.name.toLowerCase().includes(q))
        );
      })
    : logs;

  return (
    <div className="space-y-4">
      {/* Serial history drawer */}
      {selectedSerial !== null && (
        <SerialHistoryDrawer
          serial={selectedSerial}
          history={history}
          loading={historyLoading}
          error={historyError}
          onClose={closeHistory}
        />
      )}

      {/* Search + count */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי מ.ס, טכנאי, סוג לקוח או חלק..."
            className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
          />
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 whitespace-nowrap">
          {filtered.length} / {logs.length} רשומות
        </span>
      </div>

      {/* Table / empty states */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 py-20 text-center space-y-2">
          <p className="text-3xl">{logs.length === 0 ? "🧪" : "🔍"}</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">
            {logs.length === 0 ? "אין רשומות עדיין" : "לא נמצאו תוצאות"}
          </p>
          {logs.length === 0 && (
            <p className="text-slate-400 dark:text-slate-500 text-xs">
              רשומות ייווצרו כשמשתמשי מעבדה יגישו טפסי שחרור
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                  <th className="text-right px-5 py-3 font-medium whitespace-nowrap">תאריך</th>
                  <th className="text-right px-5 py-3 font-medium whitespace-nowrap">
                    מ.ס
                    <span className="normal-case font-normal text-slate-400 mr-1">(לחץ לפרטים)</span>
                  </th>
                  <th className="text-right px-5 py-3 font-medium whitespace-nowrap hidden md:table-cell">טכנאי</th>
                  <th className="text-right px-5 py-3 font-medium whitespace-nowrap hidden sm:table-cell">שעות</th>
                  <th className="text-right px-5 py-3 font-medium whitespace-nowrap hidden lg:table-cell">טוהר אוויר</th>
                  <th className="text-right px-5 py-3 font-medium whitespace-nowrap hidden lg:table-cell">לקוח</th>
                  <th className="text-right px-5 py-3 font-medium">חלקים / שירות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {filtered.map((log) => {
                  const { date, time } = fmtDate(log.date);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      {/* Date */}
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 rounded-full inline-block">
                          {date} · {time}
                        </div>
                      </td>

                      {/* Serial — clickable */}
                      <td className="px-5 py-3">
                        <button
                          type="button"
                          onClick={() => openHistory(log.serialNumber)}
                          className="font-mono text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-lg whitespace-nowrap hover:ring-2 hover:ring-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 hover:text-teal-700 dark:hover:text-teal-300 transition-all cursor-pointer"
                          dir="ltr"
                          title="הצג היסטוריה"
                        >
                          {log.serialNumber}
                        </button>
                      </td>

                      {/* Technician */}
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-300 hidden md:table-cell whitespace-nowrap">
                        {log.technician.name}
                      </td>

                      {/* Working hours */}
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className="text-slate-700 dark:text-slate-200 font-medium">
                          {log.workingHours.toLocaleString()}
                        </span>
                      </td>

                      {/* Air purity */}
                      <td className="px-5 py-3 hidden lg:table-cell whitespace-nowrap">
                        {log.airPurity != null ? (
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            log.airPurity >= 93
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                          }`}>
                            {log.airPurity}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>

                      {/* Customer type */}
                      <td className="px-5 py-3 hidden lg:table-cell whitespace-nowrap">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${CUSTOMER_BADGE[log.customerType]}`}>
                          {CUSTOMER_LABELS[log.customerType as keyof typeof CUSTOMER_LABELS]}
                        </span>
                      </td>

                      {/* Parts / Inspection */}
                      <td className="px-5 py-3 max-w-xs">
                        {log.isInspectionOnly ? (
                          <span className="text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-1 rounded-full whitespace-nowrap">
                            🔍 בדיקה בלבד
                          </span>
                        ) : log.parts.length === 0 ? (
                          <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {log.parts.map((p) => (
                              <span
                                key={p.name}
                                className="text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full whitespace-nowrap"
                              >
                                {p.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
