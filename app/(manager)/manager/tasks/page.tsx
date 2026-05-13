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

export default async function TasksPage() {
  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      deliveryAddress: true,
      status: true,
      taskType: true,
      scheduledFor: true,
      createdAt: true,
      assignedDriver: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">משימות</h1>
          <p className="text-slate-500 text-sm mt-1">{tasks.length} משימות במערכת</p>
        </div>
        <Link
          href="/manager/tasks/new"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          משימה חדשה
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {tasks.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">אין משימות במערכת עדיין</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <th className="text-right px-6 py-3 font-medium">משימה</th>
                <th className="text-right px-6 py-3 font-medium hidden md:table-cell">כתובת</th>
                <th className="text-right px-6 py-3 font-medium hidden sm:table-cell">נהג</th>
                <th className="text-right px-6 py-3 font-medium hidden lg:table-cell">תאריך יצירה</th>
                <th className="text-right px-6 py-3 font-medium">סטטוס</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span>{task.taskType === "DELIVERY" ? "📦" : "🔧"}</span>
                      <p className="font-medium text-slate-800 truncate max-w-[160px]">{task.title}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 hidden md:table-cell">
                    <p className="truncate max-w-[200px]">{task.deliveryAddress}</p>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className="text-slate-700">{task.assignedDriver.name}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs hidden lg:table-cell">
                    {new Date(task.createdAt).toLocaleDateString("he-IL")}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColor[task.status]}`}>
                      {statusLabel[task.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/manager/tasks/${task.id}`}
                      className="text-blue-600 hover:text-blue-700 font-medium text-xs"
                    >
                      פרטים
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
