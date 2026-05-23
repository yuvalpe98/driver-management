import { prisma } from "@/lib/prisma";
import DeliveryLog from "./DeliveryLog";

// Always fetch fresh data — no stale cache
export const dynamic = "force-dynamic";

export default async function DeliveriesPage() {
  const raw = await prisma.taskCompletion.findMany({
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
          id: true,
          serialNumber: true,
          scannedAt: true,
          taskItem: { select: { name: true, quantity: true } },
        },
        orderBy: { scannedAt: "asc" },
      },
    },
  });

  // Serialize Dates to strings so they survive the server → client boundary
  const deliveries = raw.map((c) => ({
    id: c.id,
    completedAt: c.completedAt.toISOString(),
    recipientName: c.recipientName,
    task: c.task,
    scannedSerials: c.scannedSerials.map((s) => ({
      id: s.id,
      serialNumber: s.serialNumber,
      scannedAt: s.scannedAt.toISOString(),
      taskItem: s.taskItem,
    })),
  }));

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">יומן מסירות</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            כל המסירות שהושלמו — פריטים, מספרי סידורי וחתימות
          </p>
        </div>

        <a
          href="/api/deliveries/export"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
          download
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          ייצוא Excel / CSV
        </a>
      </div>

      <DeliveryLog deliveries={deliveries} />
    </div>
  );
}
