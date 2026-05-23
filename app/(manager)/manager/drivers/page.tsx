import { prisma } from "@/lib/prisma";
import Link from "next/link";

const roleBadge: Record<string, { label: string; classes: string }> = {
  DRIVER:   { label: "נהג",         classes: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  LAB_USER: { label: "משתמש מעבדה", classes: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300" },
};

export default async function DriversPage() {
  const users = await prisma.user.findMany({
    where: { role: { in: ["DRIVER", "LAB_USER"] } },
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      username: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { assignedTasks: true } },
    },
  });

  const drivers  = users.filter((u) => u.role === "DRIVER");
  const labUsers = users.filter((u) => u.role === "LAB_USER");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">ניהול צוות</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {drivers.length} נהגים · {labUsers.length} משתמשי מעבדה
          </p>
        </div>
        <Link
          href="/manager/drivers/new"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          הוסף חבר צוות
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        {users.length === 0 ? (
          <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-sm">אין משתמשים במערכת עדיין</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                <th className="text-right px-6 py-3 font-medium">שם</th>
                <th className="text-right px-6 py-3 font-medium hidden md:table-cell">שם משתמש</th>
                <th className="text-right px-6 py-3 font-medium">תפקיד</th>
                <th className="text-right px-6 py-3 font-medium hidden lg:table-cell">טלפון</th>
                <th className="text-right px-6 py-3 font-medium hidden sm:table-cell">משימות</th>
                <th className="text-right px-6 py-3 font-medium">סטטוס</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {users.map((user) => {
                const badge = roleBadge[user.role] ?? { label: user.role, classes: "bg-slate-100 text-slate-600" };
                return (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-blue-600 dark:text-blue-300">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium text-slate-800 dark:text-slate-100">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 hidden md:table-cell">{user.username}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.classes}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 hidden lg:table-cell">
                      {user.phone ?? "—"}
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      {user.role === "DRIVER" ? (
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{user._count.assignedTasks}</span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        user.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-500"
                      }`}>
                        {user.isActive ? "פעיל" : "לא פעיל"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === "DRIVER" ? (
                        <Link
                          href={`/manager/drivers/${user.id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium text-xs"
                        >
                          פרטים
                        </Link>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
