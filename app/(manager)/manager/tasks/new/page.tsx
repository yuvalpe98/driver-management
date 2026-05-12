import { prisma } from "@/lib/prisma";
import NewTaskForm from "./NewTaskForm";

export default async function NewTaskPage() {
  const drivers = await prisma.user.findMany({
    where: { role: "DRIVER", isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-lg">
      <NewTaskForm drivers={drivers} />
    </div>
  );
}
