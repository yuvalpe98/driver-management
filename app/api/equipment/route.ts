import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createEquipmentSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET() {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  if (session.user.role === "MANAGER") {
    // Manager sees all drivers' equipment grouped
    const equipment = await prisma.equipment.findMany({
      orderBy: [{ driverId: "asc" }, { name: "asc" }],
      select: {
        id: true, name: true, status: true, notes: true, updatedAt: true,
        driver: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(equipment);
  }

  // Driver sees only their own equipment
  const equipment = await prisma.equipment.findMany({
    where: { driverId: session.user.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true, status: true, notes: true, updatedAt: true },
  });
  return NextResponse.json(equipment);
}

export async function POST(req: Request) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  // Both drivers and managers can add equipment; drivers only for themselves
  const driverId = session.user.role === "DRIVER" ? session.user.id : null;
  if (!driverId) {
    return NextResponse.json({ error: "מנהלים לא מוסיפים ציוד ישירות" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createEquipmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "שם ציוד לא תקין" }, { status: 400 });
  }

  const existing = await prisma.equipment.findFirst({
    where: { driverId, name: { equals: parsed.data.name, mode: "insensitive" } },
  });
  if (existing) {
    return NextResponse.json({ error: "פריט ציוד זה כבר קיים ברשימה" }, { status: 409 });
  }

  const item = await prisma.equipment.create({
    data: { name: parsed.data.name, driverId, status: "GOOD" },
    select: { id: true, name: true, status: true },
  });

  return NextResponse.json(item, { status: 201 });
}
