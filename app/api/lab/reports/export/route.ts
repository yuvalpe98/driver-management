import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

const CUSTOMER_LABELS: Record<string, string> = {
  OCCASIONAL_CUSTOMER: "לקוח מזדמן",
  CLALIT_ENGINEERING:  "כללית הנדסה",
};

// GET /api/lab/reports/export
// Returns a UTF-8 CSV (with BOM for Excel Hebrew compatibility) of ALL lab release logs.
export async function GET() {
  const { error } = await requireRole("MANAGER");
  if (error) return error;

  const logs = await prisma.labReleaseLog.findMany({
    orderBy: { date: "desc" },
    select: {
      id:              true,
      serialNumber:    true,
      date:            true,
      workingHours:    true,
      airPurity:       true,
      customerType:    true,
      isInspectionOnly: true,
      createdAt:       true,
      technician:      { select: { name: true } },
      parts:           { select: { name: true }, orderBy: { name: "asc" } },
    },
  });

  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const fmtDate = (d: Date) => d.toLocaleDateString("he-IL");
  const fmtTime = (d: Date) => d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });

  const headers = [
    "תאריך", "שעה", "מספר סידורי", "טכנאי",
    "שעות פעולה", "טוהר אוויר (%)", "סוג לקוח", "חלקים שהוחלפו", "בדיקה בלבד",
  ];

  const rows = logs.map((log) => [
    fmtDate(log.date),
    fmtTime(log.date),
    log.serialNumber,
    log.technician.name,
    String(log.workingHours),
    log.airPurity != null ? String(log.airPurity) : "",
    CUSTOMER_LABELS[log.customerType] ?? log.customerType,
    log.isInspectionOnly ? "" : log.parts.map((p) => p.name).join("; "),
    log.isInspectionOnly ? "כן" : "לא",
  ]);

  const BOM = "﻿";
  const csv =
    BOM +
    [headers, ...rows]
      .map((row) => row.map(esc).join(","))
      .join("\r\n");

  const filename = `lab-report-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
