import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createEquipmentSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET() {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  if (session.user.role === "MANAGER") {
    const equipment = await prisma.equipment.findMany({
      orderBy: [{ driverId: "asc" }, { catalogItem: { name: "asc" } }],
      select: {
        id: true, status: true, notes: true, updatedAt: true,
        catalogItem: { select: { name: true } },
        driver: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(equipment);
  }

  // Driver sees only their own equipment
  const equipment = await prisma.equipment.findMany({
    where: { driverId: session.user.id },
    orderBy: { catalogItem: { name: "asc" } },
    select: {
      id: true, status: true, notes: true, updatedAt: true,
      catalogItem: { select: { name: true } },
    },
  });
  return NextResponse.json(equipment);
}

export async function POST(req: Request) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const body = await req.json().catch(() => null);
  const parsed = createEquipmentSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  const { catalogItemId } = parsed.data;

  // Determine driverId
  let driverId: string;
  if (session.user.role === "DRIVER") {
    driverId = session.user.id;
  } else {
    // Manager must supply driverId
    if (!parsed.data.driverId)
      return NextResponse.json({ error: "יש לציין נהג" }, { status: 400 });
    driverId = parsed.data.driverId;
  }

  // Validate the catalog item exists and is EQUIPMENT category
  const catalogItem = await prisma.catalogItem.findUnique({ where: { id: catalogItemId } });
  if (!catalogItem)
    return NextResponse.json({ error: "פריט קטלוג לא נמצא" }, { status: 404 });
  if (catalogItem.category !== "EQUIPMENT")
    return NextResponse.json({ error: "פריט זה הוא מלאי, לא ציוד" }, { status: 400 });

  // Block duplicate: same catalog item already tracked for this driver
  const existing = await prisma.equipment.findFirst({ where: { driverId, catalogItemId } });
  if (existing)
    return NextResponse.json({ error: "פריט ציוד זה כבר קיים ברשימת הנהג" }, { status: 409 });

  const item = await prisma.equipment.create({
    data: { catalogItemId, driverId, status: "GOOD" },
    select: {
      id: true, status: true,
      catalogItem: { select: { name: true } },
    },
  });

  return NextResponse.json(item, { status: 201 });
}
