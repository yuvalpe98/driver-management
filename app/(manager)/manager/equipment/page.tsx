import { prisma } from "@/lib/prisma";

const statusConfig = {
  GOOD:         { label: "תקין",        color: "bg-green-100 text-green-700",  icon: "✅" },
  NEEDS_REPAIR: { label: "דורש תיקון", color: "bg-yellow-100 text-yellow-700", icon: "⚠️" },
  MISSING:      { label: "חסר",         color: "bg-red-100 text-red-700",      icon: "❌" },
} as const;

type Status = keyof typeof statusConfig;

export default async function ManagerEquipmentPage() {
  const drivers = await prisma.user.findMany({
    where: { role: "DRIVER", isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      equipment: {
        orderBy: { name: "asc" },
        select: { id: true, name: true, status: true, notes: true, updatedAt: true },
      },
    },
  });

  const allEquipment = drivers.flatMap((d) => d.equipment);
  const totalItems   = allEquipment.length;
  const totalMissing = allEquipment.filter((e) => e.status === "MISSING").length;
  const totalRepair  = allEquipment.filter((e) => e.status === "NEEDS_REPAIR").length;
  const driversWithIssues = drivers.filter((d) =>
    d.equipment.some((e) => e.status !== "GOOD")
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">ניהול ציוד</h1>
        <p className="text-slate-500 text-sm mt-1">סטטוס ציוד כלל הנהגים</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
          <p className="text-2xl font-bold text-slate-800">{totalItems}</p>
          <p className="text-slate-500 text-xs mt-1">סה״כ פריטים</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-5 text-center">
          <p className="text-2xl font-bold text-red-700">{totalMissing}</p>
          <p className="text-red-500 text-xs mt-1">פריטים חסרים</p>
        </div>
        <div className="bg-yellow-50 rounded-2xl p-5 text-center">
          <p className="text-2xl font-bold text-yellow-700">{totalRepair}</p>
          <p className="text-yellow-500 text-xs mt-1">דורשים תיקון</p>
        </div>
        <div className={`rounded-2xl p-5 text-center ${driversWithIssues > 0 ? "bg-red-50" : "bg-green-50"}`}>
          <p className={`text-2xl font-bold ${driversWithIssues > 0 ? "text-red-700" : "text-green-700"}`}>
            {driversWithIssues}
          </p>
          <p className={`text-xs mt-1 ${driversWithIssues > 0 ? "text-red-500" : "text-green-500"}`}>
            נהגים עם בעיות
          </p>
        </div>
      </div>

      {/* Alert banner */}
      {(totalMissing > 0 || totalRepair > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-semibold text-red-800">נדרשת התערבות</p>
            <p className="text-red-600 text-sm mt-0.5">
              {totalMissing > 0 && `${totalMissing} פריטים חסרים`}
              {totalMissing > 0 && totalRepair > 0 && " · "}
              {totalRepair > 0 && `${totalRepair} פריטים דורשים תיקון`}
            </p>
          </div>
        </div>
      )}

      {/* Per-driver equipment tables */}
      {drivers.map((driver) => {
        const issues = driver.equipment.filter((e) => e.status !== "GOOD");
        const hasIssues = issues.length > 0;

        return (
          <div
            key={driver.id}
            className={`bg-white rounded-2xl shadow-sm border overflow-hidden ${
              hasIssues ? "border-red-200" : "border-slate-100"
            }`}
          >
            {/* Driver header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${
              hasIssues ? "bg-red-50 border-red-100" : "bg-slate-50 border-slate-100"
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-blue-600">{driver.name.charAt(0)}</span>
                </div>
                <span className="font-semibold text-slate-800">{driver.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {hasIssues ? (
                  <span className="text-xs font-semibold text-red-600 bg-red-100 px-2.5 py-1 rounded-full">
                    {issues.length} בעיות
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-green-600 bg-green-100 px-2.5 py-1 rounded-full">
                    ✓ תקין
                  </span>
                )}
              </div>
            </div>

            {driver.equipment.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">אין פריטי ציוד</div>
            ) : (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-50">
                  {driver.equipment.map((item) => {
                    const cfg = statusConfig[item.status as Status];
                    return (
                      <tr key={item.id} className={item.status !== "GOOD" ? "bg-red-50/30" : ""}>
                        <td className="px-6 py-3">
                          <p className="font-medium text-slate-700">{item.name}</p>
                          {item.notes && (
                            <p className="text-slate-400 text-xs mt-0.5">{item.notes}</p>
                          )}
                        </td>
                        <td className="px-6 py-3 text-left">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
                            {cfg.icon} {cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-slate-400 text-xs text-left hidden md:table-cell">
                          {new Date(item.updatedAt).toLocaleDateString("he-IL")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}
