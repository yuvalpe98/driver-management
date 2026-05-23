import { prisma } from "@/lib/prisma";
import LabReportLog from "./LabReportLog";

export const dynamic = "force-dynamic";

export default async function LabReportsPage() {
  const raw = await prisma.labReleaseLog.findMany({
    orderBy: { date: "desc" },
    select: {
      id:               true,
      serialNumber:     true,
      date:             true,
      workingHours:     true,
      customerType:     true,
      isInspectionOnly: true,
      technician:       { select: { name: true } },
      parts:            { select: { name: true }, orderBy: { name: "asc" } },
    },
  });

  // Serialize Dates to strings for the server → client boundary
  const logs = raw.map((log) => ({
    ...log,
    date: log.date.toISOString(),
  }));

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">דוח מעבדה</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            כל רשומות שחרור ריכוזי החמצן — טכנאי, שעות, לקוח וחלקים
          </p>
        </div>

        <a
          href="/api/lab/reports/export"
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

      <LabReportLog logs={logs} />
    </div>
  );
}
