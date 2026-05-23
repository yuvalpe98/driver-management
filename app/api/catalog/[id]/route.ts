import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { updateCatalogItemSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

// PATCH /api/catalog/[id] — MANAGER only
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole("MANAGER");
  if (error) return error;

  const { id } = await params;

  const item = await prisma.catalogItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateCatalogItemSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  const { name, unit, minThreshold } = parsed.data;

  // Check for name uniqueness if changing it
  if (name && name !== item.name) {
    const conflict = await prisma.catalogItem.findUnique({ where: { name } });
    if (conflict)
      return NextResponse.json({ error: "פריט עם שם זה כבר קיים בקטלוג" }, { status: 409 });
  }

  const data: Record<string, unknown> = {};
  if (name) data["name"] = name;
  if (unit !== undefined) data["unit"] = unit ?? null;
  if (minThreshold !== undefined) data["minThreshold"] = minThreshold;

  const updated = await prisma.catalogItem.update({ where: { id }, data });
  return NextResponse.json(updated);
}

// DELETE /api/catalog/[id] — MANAGER only
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole("MANAGER");
  if (error) return error;

  const { id } = await params;

  const item = await prisma.catalogItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  // Block deletion if any driver still references this item
  const usedByInventory = await prisma.inventoryItem.count({ where: { catalogItemId: id } });
  const usedByEquipment = await prisma.equipment.count({ where: { catalogItemId: id } });

  if (usedByInventory + usedByEquipment > 0) {
    return NextResponse.json(
      { error: `לא ניתן למחוק — הפריט נמצא בשימוש אצל ${usedByInventory + usedByEquipment} נהגים` },
      { status: 409 }
    );
  }

  await prisma.catalogItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
