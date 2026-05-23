import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

// GET /api/deliveries/export
// Returns a UTF-8 CSV (with BOM for Excel Hebrew compatibility) of ALL completions.
export async function GET() {
  const { error } = await requireRole("MANAGER");
  if (error) return error;

  const completions = await prisma.taskCompletion.findMany({
    orderBy: { completedAt: "desc" },
    select: {
      id: true,
      completedAt: true,
      recipientName: true,
      task: {
        select: {
          title: true,
          deliveryAddress: true,
          assignedDriver: { select: { name: true } },
        },
      },
      scannedSerials: {
        select: {
          serialNumber: true,
          scannedAt: true,
          taskItem: { select: { name: true, quantity: true } },
        },
        orderBy: { scannedAt: "asc" },
      },
    },
  });

  // ── Build CSV ─────────────────────────────────────────────────────────────
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const fmtDate = (d: Date) => d.toLocaleDateString("he-IL");
  const fmtTime = (d: Date) => d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });

  const headers = [
    "תאריך", "שעה", "נהג", "לקוח", "כתובת",
    "שם משימה", "שם פריט", "כמות פריט", "מספר סידורי", "זמן סריקה",
  ];

  const rows: string[][] = [];

  for (const c of completions) {
    const date = fmtDate(c.completedAt);
    const time = fmtTime(c.completedAt);
    const driver = c.task.assignedDriver.name;
    const customer = c.recipientName;
    const address = c.task.deliveryAddress;
    const title = c.task.title;

    if (c.scannedSerials.length === 0) {
      // Maintenance task or pre-Step4 completion — no serials
      rows.push([date, time, driver, customer, address, title, "", "", "", ""]);
    } else {
      for (const s of c.scannedSerials) {
        rows.push([
          date, time, driver, customer, address, title,
          s.taskItem.name,
          String(s.taskItem.quantity),
          s.serialNumber,
          fmtTime(s.scannedAt),
        ]);
      }
    }
  }

  const BOM = "﻿";
  const csv =
    BOM +
    [headers, ...rows]
      .map((row) => row.map(esc).join(","))
      .join("\r\n");

  const filename = `delivery-log-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
