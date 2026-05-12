import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ToggleDriverButton from "./ToggleDriverButton";

const statusLabel: Record<string, string> = {
  PENDING: "ממתין", IN_PROGRESS: "בביצוע", COMPLETED: "הושלם", CANCELLED: "בוטל",
};
const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

export default async function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const driver = await prisma.user.findUnique({
    where: { id, role: "DRIVER" },
    select: {
      id: true, name: true, email: true, phone: true, isActive: true, createdAt: true,
      assignedTasks: {
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, status: true, deliveryAddress: true, createdAt: true },
      },
    },
  });

  if (!driver) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/manager/drivers"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors text-slate-500"
        >
          ←
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">פרטי נהג</h1>
      </div>

      {/* Driver card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-xl font-bold text-blue-600">
              {driver.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{driver.name}</h2>
              <p className="text-slate-500 text-sm">{driver.email}</p>
              {driver.phone && <p className="text-slate-400 text-sm">{driver.phone}</p>}
              <p className="text-slate-400 text-xs mt-1">
                הצטרף: {new Date(driver.createdAt).toLocaleDateString("he-IL")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${driver.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
              {driver.isActive ? "פעיל" : "לא פעיל"}
            </span>
            <ToggleDriverButton driverId={driver.id} isActive={driver.isActive} />
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">
            משימות ({driver.assignedTasks.length})
          </h3>
        </div>
        {driver.assignedTasks.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm">אין משימות לנהג זה</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {driver.assignedTasks.map((task) => (
              <div key={task.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 text-sm">{task.title}</p>
                  <p className="text-slate-400 text-xs mt-0.5 truncate">{task.deliveryAddress}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${statusColor[task.status]}`}>
                  {statusLabel[task.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
