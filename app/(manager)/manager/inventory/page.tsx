import { prisma } from "@/lib/prisma";
import InventoryManager from "./InventoryManager";

export default async function ManagerInventoryPage() {
  const drivers = await prisma.user.findMany({
    where: { role: "DRIVER", isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      inventory: {
        orderBy: { catalogItem: { name: "asc" } },
        select: {
          id: true,
          quantity: true,
          updatedAt: true,
          catalogItem: { select: { name: true, unit: true } },
        },
      },
    },
  });

  // Flatten catalogItem into the shape existing InventoryManager expects
  const driversFlat = drivers.map((d) => ({
    ...d,
    inventory: d.inventory.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      updatedAt: i.updatedAt,
      name: i.catalogItem.name,
      unit: i.catalogItem.unit ?? "יחידות",
    })),
  }));

  const allNames = [
    ...new Set(driversFlat.flatMap((d) => d.inventory.map((i) => i.name))),
  ].sort();

  const totalItems = driversFlat.reduce((sum, d) => sum + d.inventory.length, 0);
  const lowStockDrivers = driversFlat.filter((d) => d.inventory.some((i) => i.quantity <= 2)).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">מלאי</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">סקירה וניהול מלאי ציוד לפי נהג</p>
      </div>

      {/* Pivot table overview */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">סקירה כללית</h2>
        {allNames.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
            אין פריטי מלאי במערכת
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                  <th className="text-right px-5 py-3 font-semibold text-slate-600 dark:text-slate-300 sticky right-0 bg-slate-50 dark:bg-slate-700/50 z-10">נהג</th>
                  {allNames.map((name) => (
                    <th key={name} className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300 text-center whitespace-nowrap">{name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                {driversFlat.map((driver) => {
                  const qtyMap = new Map(driver.inventory.map((i) => [i.name, i.quantity]));
                  return (
                    <tr key={driver.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-100 sticky right-0 bg-white dark:bg-slate-800 z-10">{driver.name}</td>
                      {allNames.map((name) => {
                        const qty = qtyMap.get(name) ?? 0;
                        return (
                          <td key={name} className="px-4 py-3 text-center">
                            <span className={qty <= 2 ? "text-red-600 font-bold" : "text-slate-700 dark:text-slate-200"}>{qty}</span>
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
      </section>

      {/* Per-driver editable inventory */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">עריכת מלאי לפי נהג</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">סה״כ פריטים</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{totalItems}</p>
          </div>
          <div className={`rounded-2xl border shadow-sm p-5 ${lowStockDrivers > 0 ? "bg-red-50 border-red-200" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700"}`}>
            <p className={`text-xs font-medium ${lowStockDrivers > 0 ? "text-red-500" : "text-slate-400 dark:text-slate-500"}`}>נהגים עם מלאי נמוך</p>
            <p className={`text-2xl font-bold mt-1 ${lowStockDrivers > 0 ? "text-red-700" : "text-slate-800 dark:text-slate-100"}`}>{lowStockDrivers}</p>
          </div>
        </div>

        {driversFlat.map((driver) => (
          <div key={driver.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center font-bold text-blue-600 text-sm">{driver.name.charAt(0)}</div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{driver.name}</p>
                  <p className="text-slate-400 dark:text-slate-500 text-xs">{driver.inventory.length} פריטים</p>
                </div>
              </div>
              {driver.inventory.some((i) => i.quantity <= 2) && (
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">מלאי נמוך</span>
              )}
            </div>
            <div className="px-6 py-4">
              <InventoryManager
                driverId={driver.id}
                initialItems={driver.inventory.map((i) => ({ ...i, updatedAt: i.updatedAt.toISOString() }))}
              />
            </div>
          </div>
        ))}

        {driversFlat.length === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 py-16 text-center text-slate-400 dark:text-slate-500 text-sm">אין נהגים פעילים במערכת</div>
        )}
      </section>
    </div>
  );
}
