import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const statusLabel: Record<string, string> = {
  PENDING:     "ממתין",
  IN_PROGRESS: "בביצוע",
  COMPLETED:   "הושלם",
  CANCELLED:   "בוטל",
};

const statusColor: Record<string, string> = {
  PENDING:     "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED:   "bg-green-100 text-green-700",
  CANCELLED:   "bg-slate-100 text-slate-500",
};

const statusIcon: Record<string, string> = {
  PENDING:     "🕐",
  IN_PROGRESS: "🚚",
  COMPLETED:   "✅",
  CANCELLED:   "❌",
};

const priorityConfig: Record<"URGENT" | "NORMAL" | "LOW", { label: string; color: string }> = {
  URGENT: { label: "דחוף", color: "bg-red-100 text-red-700" },
  NORMAL: { label: "רגיל", color: "bg-blue-100 text-blue-700" },
  LOW:    { label: "נמוך",  color: "bg-slate-100 text-slate-500" },
};

const priorityRank: Record<"URGENT" | "NORMAL" | "LOW", number> = { URGENT: 0, NORMAL: 1, LOW: 2 };

export default async function DriverDashboard() {
  const session = await auth();
  const driverId = session!.user.id;

  // SECURITY: every query filters by the authenticated driver's ID
  const [tasks, completedCount, pendingCount] = await Promise.all([
    prisma.task.findMany({
      where: { assignedDriverId: driverId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        deliveryAddress: true,
        status: true,
        priority: true,
        scheduledFor: true,
        createdAt: true,
      },
    }),
    prisma.task.count({ where: { assignedDriverId: driverId, status: "COMPLETED" } }),
    prisma.task.count({ where: { assignedDriverId: driverId, status: "PENDING" } }),
  ]);

  const activeTasks = tasks
    .filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS")
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
  const doneTasks = tasks.filter((t) => t.status === "COMPLETED" || t.status === "CANCELLED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">שלום, {session?.user.name} 👋</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">המשימות שהוקצו לך היום</p>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-yellow-50 rounded-2xl p-5 flex items-center gap-3">
          <span className="text-2xl">🕐</span>
          <div>
            <p className="text-slate-500 text-xs">ממתינות</p>
            <p className="text-yellow-700 text-2xl font-bold">{pendingCount}</p>
          </div>
        </div>
        <div className="bg-green-50 rounded-2xl p-5 flex items-center gap-3">
          <span className="text-2xl">✅</span>
          <div>
            <p className="text-slate-500 text-xs">הושלמו</p>
            <p className="text-green-700 text-2xl font-bold">{completedCount}</p>
          </div>
        </div>
      </div>

      {/* Active tasks */}
      {activeTasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
            משימות פעילות
          </h2>
          {activeTasks.map((task) => (
            <Link
              key={task.id}
              href={`/driver/tasks/${task.id}`}
              className="block bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5 hover:border-blue-200 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span>{statusIcon[task.status]}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[task.status]}`}>
                      {statusLabel[task.status]}
                    </span>
                    {task.priority !== "NORMAL" && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${priorityConfig[task.priority].color}`}>
                        {priorityConfig[task.priority].label}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">{task.title}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {task.deliveryAddress}
                  </p>
                  {task.scheduledFor && (
                    <p className="text-slate-400 text-xs mt-1">
                      מתוכנן: {new Date(task.scheduledFor).toLocaleDateString("he-IL", {
                        day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
                <svg className="w-5 h-5 text-slate-300 shrink-0 mt-1 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Completed tasks */}
      {doneTasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-slate-400 text-sm uppercase tracking-wide">
            משימות שהסתיימו
          </h2>
          {doneTasks.map((task) => (
            <Link
              key={task.id}
              href={`/driver/tasks/${task.id}`}
              className="block bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors opacity-70"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-slate-600 dark:text-slate-300 text-sm truncate">{task.title}</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5 truncate">{task.deliveryAddress}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${statusColor[task.status]}`}>
                  {statusLabel[task.status]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {tasks.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 py-16 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-500 dark:text-slate-400 font-medium">אין משימות כרגע</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">המנהל טרם שיבץ אותך למשימות</p>
        </div>
      )}
    </div>
  );
}
