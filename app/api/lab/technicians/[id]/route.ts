import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { updateLabTechnicianSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

// PATCH /api/lab/technicians/[id] — rename or toggle isActive
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("MANAGER");
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateLabTechnicianSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
  }

  const technician = await prisma.labTechnician.findUnique({ where: { id } });
  if (!technician) return NextResponse.json({ error: "טכנאי לא נמצא" }, { status: 404 });

  // Strip undefined so exactOptionalPropertyTypes doesn't reject the Prisma data shape
  const data = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v !== undefined),
  ) as { name?: string; isActive?: boolean };

  const updated = await prisma.labTechnician.update({
    where: { id },
    data,
    select: { id: true, name: true, isActive: true, createdAt: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/lab/technicians/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("MANAGER");
  if (error) return error;

  const { id } = await params;

  const hasLogs = await prisma.labReleaseLog.findFirst({ where: { technicianId: id } });
  if (hasLogs) {
    return NextResponse.json(
      { error: "לא ניתן למחוק טכנאי שיש לו רשומות שחרור. השבת אותו במקום." },
      { status: 409 },
    );
  }

  await prisma.labTechnician.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
