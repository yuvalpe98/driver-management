import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EquipmentList from "../equipment/EquipmentList";
import DriverInventoryManager from "./DriverInventoryManager";

export default async function DriverInventoryPage() {
  const session = await auth();
  const driverId = session!.user.id;

  const [rawEquipment, rawItems, catalogItems] = await Promise.all([
    prisma.equipment.findMany({
      where: { driverId },
      orderBy: { catalogItem: { name: "asc" } },
      select: {
        id: true, status: true, notes: true, updatedAt: true,
        catalogItemId: true,
        catalogItem: { select: { name: true } },
      },
    }),
    prisma.inventoryItem.findMany({
      where: { driverId },
      orderBy: { catalogItem: { name: "asc" } },
      select: {
        id: true, quantity: true, updatedAt: true,
        catalogItemId: true,
        catalogItem: { select: { name: true, unit: true, minThreshold: true } },
      },
    }),
    prisma.catalogItem.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, category: true, unit: true, minThreshold: true },
    }),
  ]);

  // Flatten to component shapes
  const equipment = rawEquipment.map((e) => ({
    id: e.id,
    name: e.catalogItem.name,
    status: e.status,
    notes: e.notes,
    updatedAt: e.updatedAt,
    catalogItemId: e.catalogItemId,
  }));

  const items = rawItems.map((i) => ({
    id: i.id,
    name: i.catalogItem.name,
    unit: i.catalogItem.unit ?? "יחידות",
    minThreshold: i.catalogItem.minThreshold,
    quantity: i.quantity,
    updatedAt: i.updatedAt.toISOString(),
    catalogItemId: i.catalogItemId,
  }));

  // Only offer catalog items the driver hasn't added yet
  const usedEquipmentIds = new Set(rawEquipment.map((e) => e.catalogItemId));
  const usedInventoryIds = new Set(rawItems.map((i) => i.catalogItemId));

  const availableEquipment = catalogItems
    .filter((c) => c.category === "EQUIPMENT" && !usedEquipmentIds.has(c.id))
    .map((c) => ({ id: c.id, name: c.name }));

  const availableInventory = catalogItems
    .filter((c) => c.category === "INVENTORY" && !usedInventoryIds.has(c.id))
    .map((c) => ({ id: c.id, name: c.name, unit: c.unit, minThreshold: c.minThreshold }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">מלאי וציוד</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          סטטוס ציוד ופריטי מלאי ברכב שלך
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">ציוד</h2>
        <EquipmentList initialItems={equipment} availableCatalogItems={availableEquipment} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
          מלאי ({items.length} פריטים)
        </h2>
        <DriverInventoryManager initialItems={items} availableCatalogItems={availableInventory} />
      </section>
    </div>
  );
}
