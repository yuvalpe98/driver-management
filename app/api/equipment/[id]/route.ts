import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { updateEquipmentSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;

  // Drivers can only update their own equipment
  const where =
    session.user.role === "DRIVER"
      ? { id, driverId: session.user.id }
      : { id };

  const item = await prisma.equipment.findUnique({ where });
  if (!item) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateEquipmentSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  const updated = await prisma.equipment.update({
    where: { id },
    data: { status: parsed.data.status, notes: parsed.data.notes ?? item.notes },
    select: {
      id: true, status: true, notes: true,
      catalogItem: { select: { name: true } },
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;

  // Drivers can only delete their own equipment
  const where =
    session.user.role === "DRIVER"
      ? { id, driverId: session.user.id }
      : { id };

  const item = await prisma.equipment.findUnique({ where });
  if (!item) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  await prisma.equipment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
