import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StatCard from "@/components/ui/StatCard";
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

export default async function ManagerDashboard() {
  const session = await auth();

  const [totalDrivers, totalTasks, completedTasks, pendingTasks, recentTasks, equipmentIssues] =
    await Promise.all([
      prisma.user.count({ where: { role: "DRIVER", isActive: true } }),
      prisma.task.count(),
      prisma.task.count({ where: { status: "COMPLETED" } }),
      prisma.task.count({ where: { status: "PENDING" } }),
      prisma.task.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          title: true,
          deliveryAddress: true,
          status: true,
          createdAt: true,
          assignedDriver: { select: { name: true } },
        },
      }),
      prisma.equipment.count({ where: { status: { in: ["MISSING", "NEEDS_REPAIR"] } } }),
    ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          שלום, {session?.user.name} 👋
        </h1>
        <p className="text-slate-500 mt-1 text-sm">סקירה כללית של המערכת</p>
      </div>

      {/* Equipment alert */}
      {equipmentIssues > 0 && (
        <Link
          href="/manager/equipment"
          className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 hover:bg-red-100 transition-colors"
        >
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold text-red-800 text-sm">בעיות ציוד פעילות</p>
            <p className="text-red-600 text-xs mt-0.5">{equipmentIssues} פריטים דורשים תשומת לב ← לחץ לפרטים</p>
          </div>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="נהגים פעילים"
          value={totalDrivers}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <StatCard
          label="סה״כ משימות"
          value={totalTasks}
          color="slate"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <StatCard
          label="ממתינות"
          value={pendingTasks}
          color="yellow"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="הושלמו"
          value={completedTasks}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Recent tasks */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">משימות אחרונות</h2>
          <Link
            href="/manager/tasks"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            כל המשימות ←
          </Link>
        </div>

        {recentTasks.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">
            אין משימות עדיין
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentTasks.map((task) => (
              <div key={task.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 text-sm truncate">{task.title}</p>
                  <p className="text-slate-400 text-xs mt-0.5 truncate">{task.deliveryAddress}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-500 hidden sm:block">
                    {task.assignedDriver.name}
                  </span>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[task.status]}`}>
                    {statusLabel[task.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/manager/drivers"
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-4 hover:border-blue-200 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-800">ניהול נהגים</p>
            <p className="text-slate-400 text-xs mt-0.5">הוספה, עריכה, הסרה</p>
          </div>
        </Link>

        <Link
          href="/manager/tasks"
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-4 hover:border-blue-200 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-800">הוספת משימה</p>
            <p className="text-slate-400 text-xs mt-0.5">שיבוץ משימה לנהג</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
