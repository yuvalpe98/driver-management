"use client";

import { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────

interface ScannedSerial {
  id: string;
  serialNumber: string;
  scannedAt: string;
  taskItem: { name: string; quantity: number };
}

interface Delivery {
  id: string;
  completedAt: string;
  recipientName: string;
  task: {
    title: string;
    deliveryAddress: string;
    assignedDriver: { name: string };
  };
  scannedSerials: ScannedSerial[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("he-IL"),
    time: d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
  };
}

/** Group an array of ScannedSerial by their taskItem name */
function groupByItem(serials: ScannedSerial[]): Map<string, ScannedSerial[]> {
  const map = new Map<string, ScannedSerial[]>();
  for (const s of serials) {
    const key = s.taskItem.name;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return map;
}

// ── Delivery card ─────────────────────────────────────────────────────────────

function DeliveryCard({ delivery }: { delivery: Delivery }) {
  const [expanded, setExpanded] = useState(false);
  const { date, time } = fmtDateTime(delivery.completedAt);
  const itemGroups = groupByItem(delivery.scannedSerials);
  const totalSerials = delivery.scannedSerials.length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-right px-5 py-4 flex items-start justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
      >
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Date + driver */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 rounded-full">
              {date} · {time}
            </span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              🚗 {delivery.task.assignedDriver.name}
            </span>
          </div>

          {/* Customer + address */}
          <div className="flex items-center gap-3 flex-wrap text-sm text-slate-600 dark:text-slate-300">
            <span>👤 {delivery.recipientName}</span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="text-slate-400 dark:text-slate-500 truncate">📍 {delivery.task.deliveryAddress}</span>
          </div>
        </div>

        {/* Right side: serial count + chevron */}
        <div className="flex items-center gap-3 shrink-0">
          {totalSerials > 0 ? (
            <span className="text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full">
              {totalSerials} מ.ס
            </span>
          ) : (
            <span className="text-xs text-slate-400 dark:text-slate-500 px-2.5 py-1">ללא מ.ס</span>
          )}
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-700 px-5 py-4 space-y-4">
          {/* Task title */}
          <p className="text-xs text-slate-400 dark:text-slate-500">
            משימה: <span className="font-medium text-slate-600 dark:text-slate-300">{delivery.task.title}</span>
          </p>

          {itemGroups.size === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">אין פריטים עם מספרי סידורי למסירה זו</p>
          ) : (
            <div className="space-y-3">
              {Array.from(itemGroups.entries()).map(([itemName, serials]) => (
                <div key={itemName} className="space-y-1.5">
                  {/* Item header */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{itemName}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      ({serials.length}/{serials[0]?.taskItem.quantity ?? "?"})
                    </span>
                  </div>

                  {/* Serial pills */}
                  <div className="flex flex-wrap gap-2">
                    {serials.map((s) => (
                      <span
                        key={s.id}
                        className="font-mono text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-lg"
                        dir="ltr"
                        title={`נסרק בשעה ${fmtDateTime(s.scannedAt).time}`}
                      >
                        {s.serialNumber}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DeliveryLog({ deliveries }: { deliveries: Delivery[] }) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? deliveries.filter((d) => {
        const q = search.trim().toLowerCase();
        return (
          d.task.assignedDriver.name.toLowerCase().includes(q) ||
          d.recipientName.toLowerCase().includes(q) ||
          d.task.deliveryAddress.toLowerCase().includes(q) ||
          d.task.title.toLowerCase().includes(q) ||
          d.scannedSerials.some((s) => s.serialNumber.toLowerCase().includes(q))
        );
      })
    : deliveries;

  return (
    <div className="space-y-4">
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
            placeholder="חיפוש לפי נהג, לקוח, כתובת או מספר סידורי..."
            className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 whitespace-nowrap">
          {filtered.length} / {deliveries.length} מסירות
        </span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 py-20 text-center space-y-2">
          <p className="text-3xl">{deliveries.length === 0 ? "📭" : "🔍"}</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">
            {deliveries.length === 0 ? "אין מסירות עדיין" : "לא נמצאו תוצאות"}
          </p>
          {deliveries.length === 0 && (
            <p className="text-slate-400 dark:text-slate-500 text-xs">
              כשנהגים יסיימו משימות, הן יופיעו כאן
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => (
            <DeliveryCard key={d.id} delivery={d} />
          ))}
        </div>
      )}
    </div>
  );
}
