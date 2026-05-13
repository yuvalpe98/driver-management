import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createInventoryItemSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const { searchParams } = new URL(req.url);
  const driverIdParam = searchParams.get("driverId");

  if (session.user.role === "DRIVER") {
    const items = await prisma.inventoryItem.findMany({
      where: { driverId: session.user.id },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(items);
  }

  // Manager: filter by driverId or return all grouped by driver
  const where = driverIdParam ? { driverId: driverIdParam } : {};
  const items = await prisma.inventoryItem.findMany({
    where,
    orderBy: [{ driverId: "asc" }, { name: "asc" }],
    include: { driver: { select: { id: true, name: true } } },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const body = await req.json().catch(() => null);
  const parsed = createInventoryItemSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  const { name, quantity, unit } = parsed.data;

  // Drivers can only create items for themselves; managers must supply driverId
  let driverId: string;
  if (session.user.role === "DRIVER") {
    driverId = session.user.id;
  } else {
    if (!parsed.data.driverId) {
      return NextResponse.json({ error: "יש לציין נהג" }, { status: 400 });
    }
    driverId = parsed.data.driverId;
  }

  // Upsert: if item with same name already exists for this driver, update quantity
  const item = await prisma.inventoryItem.upsert({
    where: { driverId_name: { driverId, name } },
    update: { quantity, unit: unit ?? "יחידות" },
    create: { driverId, name, quantity, unit: unit ?? "יחידות" },
  });

  return NextResponse.json(item, { status: 201 });
}
