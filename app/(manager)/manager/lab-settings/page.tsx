import { prisma } from "@/lib/prisma";
import LabSettingsManager from "./LabSettingsManager";

export const dynamic = "force-dynamic";

export default async function LabSettingsPage() {
  const [technicians, parts] = await Promise.all([
    prisma.labTechnician.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, isActive: true, createdAt: true },
    }),
    prisma.labPart.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, isActive: true, createdAt: true },
    }),
  ]);

  // Serialize Dates for the client boundary
  const serializeTechs = technicians.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() }));
  const serializeParts = parts.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }));

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">הגדרות מעבדה</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          ניהול טכנאים וחלקים לטופס שחרור ריכוזי חמצן
        </p>
      </div>

      <LabSettingsManager technicians={serializeTechs} parts={serializeParts} />
    </div>
  );
}
