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

  // SECURITY: ownership check — driver can only complete their own tasks
  const task = await prisma.task.findUnique({
    where: { id, assignedDriverId: driverId },
    select: { id: true, title: true, deliveryAddress: true, status: true },
  });

  if (!task || task.status === "COMPLETED" || task.status === "CANCELLED") {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4">
        <p className="text-xs text-blue-500 font-medium mb-1">משלוח שמסתיים</p>
        <p className="font-bold text-blue-900">{task.title}</p>
        <p className="text-blue-600 text-sm mt-0.5">{task.deliveryAddress}</p>
      </div>

      <CompleteTaskForm taskId={task.id} />
    </div>
  );
}
