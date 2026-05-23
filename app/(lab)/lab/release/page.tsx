import { prisma } from "@/lib/prisma";
import LabReleaseForm from "./LabReleaseForm";

export const dynamic = "force-dynamic";

export default async function LabReleasePage() {
  const [technicians, parts] = await Promise.all([
    prisma.labTechnician.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.labPart.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">טופס שחרור מכשיר</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          תיעוד שחרור ריכוז חמצן — סרוק או הזן מספר סידורי
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
        {technicians.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="text-3xl">👷</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
              אין טכנאים פעילים במערכת
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-xs">
              המנהל צריך להוסיף טכנאים בהגדרות המעבדה לפני שניתן לרשום שחרורים
            </p>
          </div>
        ) : (
          <LabReleaseForm technicians={technicians} parts={parts} />
        )}
      </div>
    </div>
  );
}
