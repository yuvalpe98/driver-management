import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import CancelTaskButton from "./CancelTaskButton";

const statusLabel: Record<string, string> = {
  PENDING:     "ממתין",
  IN_PROGRESS: "בביצוע",
  COMPLETED:   "הושלם",
  CANCELLED:   "בוטל",
};

const statusColor: Record<string, string> = {
  PENDING:     "bg-yellow-100 text-yellow-700 border-yellow-200",
  IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-200",
  COMPLETED:   "bg-green-100 text-green-700 border-green-200",
  CANCELLED:   "bg-slate-100 text-slate-500 border-slate-200",
};

export default async function ManagerTaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const task = await prisma.task.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      deliveryAddress: true,
      status: true,
      taskType: true,
      scheduledFor: true,
      completedAt: true,
      createdAt: true,
      assignedDriver: { select: { id: true, name: true, email: true } },
      createdByManager: { select: { name: true } },
      completion: {
        select: { recipientName: true, signatureImageUrl: true, completedAt: true },
      },
      items: { select: { name: true, quantity: true } },
    },
  });

  if (!task) notFound();

  const canCancel = task.status === "PENDING" || task.status === "IN_PROGRESS";

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Link
          href="/manager/tasks"
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 transition-colors text-slate-500 text-lg"
        >
          ←
        </Link>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">פרטי משימה</h1>
      </div>

      {/* Main card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 space-y-5">
        {/* Status + cancel */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center text-sm font-semibold px-3 py-1.5 rounded-full border ${statusColor[task.status]}`}>
              {statusLabel[task.status]}
            </span>
            <span className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full border ${task.taskType === "DELIVERY" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-orange-50 text-orange-700 border-orange-200"}`}>
              {task.taskType === "DELIVERY" ? "📦 משלוח" : "🔧 תחזוקה"}
            </span>
          </div>
          {canCancel && <CancelTaskButton taskId={task.id} />}
        </div>

        {/* Title */}
        <div>
          <h2 className="text-xl font-bold text-slate-800">{task.title}</h2>
          {task.description && (
            <p className="text-slate-500 text-sm mt-2">{task.description}</p>
          )}
        </div>

        {/* Details grid */}
        <div className="space-y-3 pt-2 border-t border-slate-50 dark:border-slate-700">
          <DetailRow icon="📍" label="כתובת מסירה" value={task.deliveryAddress} />
          <DetailRow
            icon="👤"
            label="נהג מוקצה"
            value={
              <Link href={`/manager/drivers/${task.assignedDriver.id}`} className="text-blue-600 hover:underline">
                {task.assignedDriver.name}
              </Link>
            }
          />
          <DetailRow icon="🧑‍💼" label="נוצר על ידי" value={task.createdByManager.name} />
          <DetailRow
            icon="📅"
            label="תאריך יצירה"
            value={new Date(task.createdAt).toLocaleDateString("he-IL", {
              day: "numeric", month: "long", year: "numeric",
            })}
          />
          {task.scheduledFor && (
            <DetailRow
              icon="🕐"
              label="מתוכנן לתאריך"
              value={new Date(task.scheduledFor).toLocaleDateString("he-IL", {
                weekday: "long", day: "numeric", month: "long",
                hour: "2-digit", minute: "2-digit",
              })}
            />
          )}
        </div>
      </div>

      {/* Delivery items */}
      {task.items.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">📦 פריטי משלוח</h3>
          <div className="divide-y divide-slate-50 dark:divide-slate-700">
            {task.items.map((item) => (
              <div key={item.name} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-slate-700 dark:text-slate-200 font-medium">{item.name}</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion proof */}
      {task.status === "COMPLETED" && task.completion && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">✅</span>
            <h3 className="font-bold text-green-800">הוכחת מסירה</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-green-600 text-xs font-medium mb-1">נמסר ל</p>
              <p className="font-semibold text-green-900">{task.completion.recipientName}</p>
            </div>
            <div>
              <p className="text-green-600 text-xs font-medium mb-1">זמן מסירה</p>
              <p className="font-semibold text-green-900">
                {new Date(task.completion.completedAt).toLocaleDateString("he-IL", {
                  day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <div>
            <p className="text-green-600 text-xs font-medium mb-2">חתימת מקבל</p>
            <div className="bg-white rounded-xl border border-green-200 p-2 inline-block">
              <Image
                src={task.completion.signatureImageUrl}
                alt="חתימת מקבל"
                width={320}
                height={160}
                className="rounded-lg"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}

      {task.status === "CANCELLED" && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <p className="text-slate-500 font-semibold text-sm">❌ המשימה בוטלה</p>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-lg mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{label}</p>
        <div className="text-slate-800 dark:text-slate-100 font-medium mt-0.5 text-sm">{value}</div>
      </div>
    </div>
  );
}
