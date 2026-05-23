import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { updateInventoryItemSchema } from "@/lib/validations";
import { sendPush } from "@/lib/push";
import { NextResponse } from "next/server";

async function resolveItem(id: string, userId: string, role: string) {
  const item = await prisma.inventoryItem.findUnique({
    where: { id },
    include: { catalogItem: { select: { name: true, unit: true } } },
  });
  if (!item) return { item: null, forbidden: false };
  if (role === "DRIVER" && item.driverId !== userId) return { item: null, forbidden: true };
  return { item, forbidden: false };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;
  const { item, forbidden } = await resolveItem(id, session.user.id, session.user.role);
  if (forbidden) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  if (!item) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateInventoryItemSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  const updated = await prisma.inventoryItem.update({
    where: { id },
    data: {
      ...(parsed.data.quantity !== undefined && { quantity: parsed.data.quantity }),
    },
    include: { catalogItem: { select: { name: true, unit: true } } },
  });

  // Notify all managers if quantity dropped to low-stock threshold
  if (parsed.data.quantity !== undefined && parsed.data.quantity <= 2) {
    const managers = await prisma.user.findMany({
      where: { role: "MANAGER", isActive: true },
      select: { id: true },
    });
    const itemName = updated.catalogItem.name;
    const itemUnit = updated.catalogItem.unit ?? "יחידות";
    managers.forEach((m) =>
      sendPush(m.id, {
        title: "מלאי נמוך",
        body: `${itemName} — נותרו ${updated.quantity} ${itemUnit}`,
        url: "/manager/inventory",
      }).catch(() => {})
    );
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;
  const { item, forbidden } = await resolveItem(id, session.user.id, session.user.role);
  if (forbidden) return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  if (!item) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  await prisma.inventoryItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
