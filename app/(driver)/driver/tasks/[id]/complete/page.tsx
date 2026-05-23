import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CompleteTaskForm from "./CompleteTaskForm";

export default async function CompleteTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const driverId = session!.user.id;
  const { id } = await params;

  const [task, taskItems] = await Promise.all([
    prisma.task.findUnique({
      where: { id, assignedDriverId: driverId },
      select: { id: true, title: true, deliveryAddress: true, status: true },
    }),
    prisma.taskItem.findMany({
      where: { taskId: id },
      select: { id: true, name: true, quantity: true },
      orderBy: { id: "asc" },
    }),
  ]);

  if (!task || task.status === "COMPLETED" || task.status === "CANCELLED") {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 rounded-2xl px-5 py-4">
        <p className="text-xs text-blue-500 dark:text-blue-400 font-medium mb-1">משלוח שמסתיים</p>
        <p className="font-bold text-blue-900 dark:text-blue-100">{task.title}</p>
        <p className="text-blue-600 dark:text-blue-300 text-sm mt-0.5">{task.deliveryAddress}</p>
      </div>

      <CompleteTaskForm taskId={task.id} taskItems={taskItems} />
    </div>
  );
}
