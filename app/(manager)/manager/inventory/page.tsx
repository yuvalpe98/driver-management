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
        orderBy: { name: "asc" },
        select: { id: true, name: true, quantity: true, unit: true, updatedAt: true },
      },
    },
  });

  const totalItems = drivers.reduce((sum, d) => sum + d.inventory.length, 0);
  const lowStockDrivers = drivers.filter((d) => d.inventory.some((i) => i.quantity <= 2)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">ניהול מלאי</h1>
        <p className="text-slate-500 text-sm mt-1">מלאי ציוד לפי נהג</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs text-slate-400 font-medium">סה״כ פריטים</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{totalItems}</p>
        </div>
        <div className={`rounded-2xl border shadow-sm p-5 ${lowStockDrivers > 0 ? "bg-red-50 border-red-200" : "bg-white border-slate-100"}`}>
          <p className={`text-xs font-medium ${lowStockDrivers > 0 ? "text-red-500" : "text-slate-400"}`}>נהגים עם מלאי נמוך</p>
          <p className={`text-2xl font-bold mt-1 ${lowStockDrivers > 0 ? "text-red-700" : "text-slate-800"}`}>{lowStockDrivers}</p>
        </div>
      </div>

      {/* Per-driver inventory */}
      {drivers.map((driver) => (
        <div key={driver.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center font-bold text-blue-600 text-sm">
                {driver.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{driver.name}</p>
                <p className="text-slate-400 text-xs">{driver.inventory.length} פריטים</p>
              </div>
            </div>
            {driver.inventory.some((i) => i.quantity <= 2) && (
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">⚠️ מלאי נמוך</span>
            )}
          </div>
          <div className="px-6 py-4">
            <InventoryManager
              driverId={driver.id}
              initialItems={driver.inventory.map((i) => ({
                ...i,
                updatedAt: i.updatedAt.toISOString(),
              }))}
            />
          </div>
        </div>
      ))}

      {drivers.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center text-slate-400 text-sm">
          אין נהגים פעילים במערכת
        </div>
      )}
    </div>
  );
}
