import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EquipmentList from "./EquipmentList";

export default async function DriverEquipmentPage() {
  const session = await auth();
  const driverId = session!.user.id;

  const equipment = await prisma.equipment.findMany({
    where: { driverId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, status: true, notes: true, updatedAt: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">הציוד שלי</h1>
        <p className="text-slate-500 text-sm mt-1">עדכן את סטטוס הציוד שברשותך</p>
      </div>

      <EquipmentList initialItems={equipment} />
    </div>
  );
}
