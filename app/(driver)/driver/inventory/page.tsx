import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DriverInventoryManager from "./DriverInventoryManager";

export default async function DriverInventoryPage() {
  const session = await auth();
  const driverId = session!.user.id;

  const items = await prisma.inventoryItem.findMany({
    where: { driverId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, quantity: true, unit: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">המלאי שלי</h1>
        <p className="text-slate-500 text-sm mt-1">פריטי ציוד ברכב שלך — {items.length} פריטים</p>
      </div>
      <DriverInventoryManager initialItems={items} />
    </div>
  );
}
