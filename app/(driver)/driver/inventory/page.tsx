import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EquipmentList from "../equipment/EquipmentList";
import DriverInventoryManager from "./DriverInventoryManager";

export default async function DriverInventoryPage() {
  const session = await auth();
  const driverId = session!.user.id;

  const [equipment, items] = await Promise.all([
    prisma.equipment.findMany({
      where: { driverId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, status: true, notes: true, updatedAt: true },
    }),
    prisma.inventoryItem.findMany({
      where: { driverId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, quantity: true, unit: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">מלאי וציוד</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">סטטוס ציוד ופריטי מלאי ברכב שלך</p>
      </div>

      {/* ── Section 1: Equipment health ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">ציוד</h2>
        <EquipmentList initialItems={equipment} />
      </section>

      {/* ── Section 2: Inventory quantities ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">מלאי ({items.length} פריטים)</h2>
        <DriverInventoryManager initialItems={items} />
      </section>
    </div>
  );
}
