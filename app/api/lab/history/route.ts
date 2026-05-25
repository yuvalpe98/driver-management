import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/lab/history?serial=<serialNumber>
// Returns all LabReleaseLog entries for a given serial, newest first.
// MANAGER only.
export async function GET(req: Request) {
  const { error } = await requireRole("MANAGER");
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const serial = searchParams.get("serial")?.trim();

  if (!serial) {
    return NextResponse.json({ error: "פרמטר serial חסר" }, { status: 400 });
  }

  const logs = await prisma.labReleaseLog.findMany({
    where: { serialNumber: { equals: serial, mode: "insensitive" } },
    orderBy: { date: "desc" },
    select: {
      id:               true,
      serialNumber:     true,
      date:             true,
      workingHours:     true,
      airPurity:        true,
      customerType:     true,
      isInspectionOnly: true,
      technician:       { select: { name: true } },
      parts:            { select: { name: true }, orderBy: { name: "asc" } },
    },
  });

  // Serialize dates for the client boundary
  return NextResponse.json(
    logs.map((log) => ({ ...log, date: log.date.toISOString() })),
  );
}
