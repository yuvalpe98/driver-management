import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createInventoryItemSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

const catalogSelect = { select: { name: true, unit: true, category: true, minThreshold: true } } as const;

export async function GET(req: Request) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const { searchParams } = new URL(req.url);
  const driverIdParam = searchParams.get("driverId");

  if (session.user.role === "DRIVER") {
    const items = await prisma.inventoryItem.findMany({
      where: { driverId: session.user.id },
      orderBy: { catalogItem: { name: "asc" } },
      include: { catalogItem: catalogSelect.select ? { select: catalogSelect.select } : true },
    });
    return NextResponse.json(items);
  }

  // Manager: filter by driverId or return all
  const where = driverIdParam ? { driverId: driverIdParam } : {};
  const items = await prisma.inventoryItem.findMany({
    where,
    orderBy: [{ driverId: "asc" }, { catalogItem: { name: "asc" } }],
    include: {
      catalogItem: { select: { name: true, unit: true } },
      driver: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const body = await req.json().catch(() => null);
  const parsed = createInventoryItemSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  const { catalogItemId, quantity } = parsed.data;

  // Drivers can only add items for themselves; managers must supply driverId
  let driverId: string;
  if (session.user.role === "DRIVER") {
    driverId = session.user.id;
  } else {
    if (!parsed.data.driverId)
      return NextResponse.json({ error: "יש לציין נהג" }, { status: 400 });
    driverId = parsed.data.driverId;
  }

  // Validate the catalog item exists and is INVENTORY category
  const catalogItem = await prisma.catalogItem.findUnique({ where: { id: catalogItemId } });
  if (!catalogItem)
    return NextResponse.json({ error: "פריט קטלוג לא נמצא" }, { status: 404 });
  if (catalogItem.category !== "INVENTORY")
    return NextResponse.json({ error: "פריט זה הוא ציוד, לא מלאי" }, { status: 400 });

  // Upsert: if same catalogItem already exists for this driver, update quantity
  const item = await prisma.inventoryItem.upsert({
    where: { driverId_catalogItemId: { driverId, catalogItemId } },
    update: { quantity },
    create: { driverId, catalogItemId, quantity },
    include: { catalogItem: { select: { name: true, unit: true } } },
  });

  return NextResponse.json(item, { status: 201 });
}
