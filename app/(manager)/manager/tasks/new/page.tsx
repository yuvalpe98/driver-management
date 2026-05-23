import { prisma } from "@/lib/prisma";
import NewTaskForm from "./NewTaskForm";

export default async function NewTaskPage() {
  const [drivers, catalogItems] = await Promise.all([
    prisma.user.findMany({
      where: { role: "DRIVER", isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.catalogItem.findMany({
      where: { category: "INVENTORY" },
      select: { id: true, name: true, unit: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="max-w-lg">
      <NewTaskForm drivers={drivers} catalogItems={catalogItems} />
    </div>
  );
}
