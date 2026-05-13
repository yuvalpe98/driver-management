import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function DriversPage() {
  const drivers = await prisma.user.findMany({
    where: { role: "DRIVER" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
      _count: { select: { assignedTasks: true } },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">נהגים</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{drivers.length} נהגים במערכת</p>
        </div>
        <Link
          href="/manager/drivers/new"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          נהג חדש
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        {drivers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-sm">אין נהגים במערכת עדיין</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                <th className="text-right px-6 py-3 font-medium">שם</th>
                <th className="text-right px-6 py-3 font-medium hidden md:table-cell">אימייל</th>
                <th className="text-right px-6 py-3 font-medium hidden lg:table-cell">טלפון</th>
                <th className="text-right px-6 py-3 font-medium hidden sm:table-cell">משימות</th>
                <th className="text-right px-6 py-3 font-medium">סטטוס</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {drivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-300">
                          {driver.name.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium text-slate-800 dark:text-slate-100">{driver.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 hidden md:table-cell">{driver.email}</td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                    {driver.phone ?? "—"}
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{driver._count.assignedTasks}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      driver.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {driver.isActive ? "פעיל" : "לא פעיל"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/manager/drivers/${driver.id}`}
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
