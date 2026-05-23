import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EquipmentList from "../equipment/EquipmentList";
import DriverInventoryManager from "./DriverInventoryManager";

export default async function DriverInventoryPage() {
  const session = await auth();
  const driverId = session!.user.id;

  const [rawEquipment, rawItems] = await Promise.all([
    prisma.equipment.findMany({
      where: { driverId },
      orderBy: { catalogItem: { name: "asc" } },
      select: { id: true, status: true, notes: true, updatedAt: true, catalogItem: { select: { name: true } } },
    }),
    prisma.inventoryItem.findMany({
      where: { driverId },
      orderBy: { catalogItem: { name: "asc" } },
      select: { id: true, quantity: true, updatedAt: true, catalogItem: { select: { name: true, unit: true } } },
    }),
  ]);

  // Flatten catalogItem into the shape existing components expect
  const equipment = rawEquipment.map((e) => ({ ...e, name: e.catalogItem.name }));
  const items = rawItems.map((i) => ({
    ...i,
    name: i.catalogItem.name,
    unit: i.catalogItem.unit ?? "יחידות",
    updatedAt: i.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">מלאי וציוד</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">סטטוס ציוד ופריטי מלאי ברכב שלך</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">ציוד</h2>
        <EquipmentList initialItems={equipment} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">מלאי ({items.length} פריטים)</h2>
        <DriverInventoryManager initialItems={items} />
      </section>
    </div>
  );
}
