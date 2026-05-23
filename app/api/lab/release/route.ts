import { requireLabAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createLabReleaseLogSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

// POST /api/lab/release
// Accessible by LAB_USER and MANAGER.
export async function POST(req: Request) {
  const { error } = await requireLabAccess();
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = createLabReleaseLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "נתונים לא תקינים", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { serialNumber, technicianId, date, workingHours, customerType, partIds, isInspectionOnly } =
    parsed.data;

  // Validate technician exists and is active
  const technician = await prisma.labTechnician.findUnique({ where: { id: technicianId } });
  if (!technician || !technician.isActive) {
    return NextResponse.json({ error: "טכנאי לא נמצא או לא פעיל" }, { status: 400 });
  }

  // Validate all parts exist and are active
  if (partIds.length > 0) {
    const foundParts = await prisma.labPart.findMany({
      where: { id: { in: partIds }, isActive: true },
      select: { id: true },
    });
    if (foundParts.length !== partIds.length) {
      return NextResponse.json({ error: "חלק אחד או יותר לא נמצא או לא פעיל" }, { status: 400 });
    }
  }

  // Parse date string ("YYYY-MM-DD") as UTC midnight
  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  const log = await prisma.labReleaseLog.create({
    data: {
      serialNumber: serialNumber.trim(),
      technicianId,
      date: parsedDate,
      workingHours,
      customerType,
      isInspectionOnly,
      parts: { connect: partIds.map((id) => ({ id })) },
    },
    select: {
      id: true,
      serialNumber: true,
      date: true,
      workingHours: true,
      customerType: true,
      isInspectionOnly: true,
      technician: { select: { name: true } },
      parts: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(log, { status: 201 });
}
