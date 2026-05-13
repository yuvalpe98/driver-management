import { prisma } from "@/lib/prisma";

export default async function ManagerEquipmentPage() {
  const drivers = await prisma.user.findMany({
    where: { role: "DRIVER", isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      inventory: {
        orderBy: { name: "asc" },
        select: { name: true, quantity: true },
      },
    },
  });

  const allNames = [
    ...new Set(drivers.flatMap((d) => d.inventory.map((i) => i.name))),
  ].sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">מלאי לפי נהג</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          כמויות ציוד זמינות לאספקה — מתעדכן אוטומטית לאחר כל משימה
        </p>
      </div>

      {allNames.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 py-16 text-center text-slate-400 dark:text-slate-500 text-sm">
          אין פריטי מלאי במערכת
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                <th className="text-right px-5 py-3 font-semibold text-slate-600 dark:text-slate-300 sticky right-0 bg-slate-50 dark:bg-slate-700/50 z-10">
                  נהג
                </th>
                {allNames.map((name) => (
                  <th
                    key={name}
                    className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-center whitespace-nowrap"
                  >
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {drivers.map((driver) => {
                const qtyMap = new Map(driver.inventory.map((i) => [i.name, i.quantity]));
                return (
                  <tr key={driver.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100 sticky right-0 bg-white dark:bg-slate-800 z-10">
                      {driver.name}
                    </td>
                    {allNames.map((name) => {
                      const qty = qtyMap.get(name) ?? 0;
                      return (
                        <td key={name} className="px-4 py-3 text-center">
                          <span
                            className={
                              qty <= 2
                                ? "text-red-600 font-bold"
                                : "text-slate-700 dark:text-slate-200"
                            }
                          >
                            {qty}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
