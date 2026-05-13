import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import StartTaskButton from "./StartTaskButton";

const statusLabel: Record<string, string> = {
  PENDING:     "ממתין לביצוע",
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

export default async function DriverTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const driverId = session!.user.id;
  const { id } = await params;

  // SECURITY: assignedDriverId must match the authenticated driver
  const task = await prisma.task.findUnique({
    where: { id, assignedDriverId: driverId },
    select: {
      id: true,
      title: true,
      description: true,
      deliveryAddress: true,
      status: true,
      scheduledFor: true,
      createdAt: true,
      completion: {
        select: { recipientName: true, completedAt: true },
      },
    },
  });

  if (!task) notFound();

  const isCompleted = task.status === "COMPLETED";
  const isCancelled = task.status === "CANCELLED";
  const isPending = task.status === "PENDING";
  const canComplete = task.status === "PENDING" || task.status === "IN_PROGRESS";

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/driver/dashboard"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm transition-colors"
      >
        <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        חזרה למשימות
      </Link>

      {/* Task card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
        {/* Status badge */}
        <span className={`inline-flex items-center text-sm font-semibold px-3 py-1.5 rounded-full border ${statusColor[task.status]}`}>
          {statusLabel[task.status]}
        </span>

        {/* Title */}
        <div>
          <h1 className="text-xl font-bold text-slate-800">{task.title}</h1>
          {task.description && (
            <p className="text-slate-500 text-sm mt-2">{task.description}</p>
          )}
        </div>

        {/* Details */}
        <div className="space-y-3 pt-2 border-t border-slate-50">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">כתובת מסירה</p>
              <p className="text-slate-800 font-medium mt-0.5">{task.deliveryAddress}</p>
            </div>
          </div>

          {task.scheduledFor && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">מתוכנן לתאריך</p>
                <p className="text-slate-800 font-medium mt-0.5">
                  {new Date(task.scheduledFor).toLocaleDateString("he-IL", {
                    weekday: "long", day: "numeric", month: "long",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">נוצר בתאריך</p>
              <p className="text-slate-800 font-medium mt-0.5">
                {new Date(task.createdAt).toLocaleDateString("he-IL", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Completion summary */}
        {isCompleted && task.completion && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-1">
            <p className="text-green-700 font-semibold text-sm">✅ המשימה הושלמה</p>
            <p className="text-green-600 text-sm">נמסר ל: {task.completion.recipientName}</p>
            <p className="text-green-500 text-xs">
              {new Date(task.completion.completedAt).toLocaleDateString("he-IL", {
                day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
        )}

        {isCancelled && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <p className="text-slate-500 font-semibold text-sm">❌ המשימה בוטלה</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {isPending && <StartTaskButton taskId={task.id} />}

      {canComplete && (
        <Link
          href={`/driver/tasks/${task.id}/complete`}
          className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl text-center shadow-sm transition-colors text-base"
        >
          ✅ סיים משימה ← חתימה
        </Link>
      )}
    </div>
  );
}
