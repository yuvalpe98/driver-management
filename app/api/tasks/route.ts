import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createTaskSchema } from "@/lib/validations";
import { sendWhatsApp } from "@/lib/whatsapp";
import { NextResponse } from "next/server";

export async function GET() {
  const { error, session } = await requireRole("MANAGER");
  if (error || !session) return error;

  const tasks = await prisma.task.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, status: true, createdAt: true,
      assignedDriver: { select: { name: true } },
    },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const { error, session } = await requireRole("MANAGER");
  if (error || !session) return error;

  const body = await req.json().catch(() => null);
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
  }

  const { title, description, deliveryAddress, assignedDriverId, scheduledFor, taskType, items } = parsed.data;

  const driver = await prisma.user.findUnique({
    where: { id: assignedDriverId, role: "DRIVER", isActive: true },
    select: { id: true, name: true, phone: true },
  });
  if (!driver) {
    return NextResponse.json({ error: "הנהג לא נמצא" }, { status: 404 });
  }

  // Inventory validation — only when items are specified
  if (items && items.length > 0) {
    const inventory = await prisma.inventoryItem.findMany({
      where: { driverId: assignedDriverId },
      select: { name: true, quantity: true },
    });
    const inventoryMap = new Map(inventory.map((i) => [i.name, i.quantity]));

    const shortages = items.filter((item) => (inventoryMap.get(item.name) ?? 0) < item.quantity);
    if (shortages.length > 0) {
      return NextResponse.json(
        {
          error: "מלאי לא מספיק",
          shortages: shortages.map((s) => ({
            name: s.name,
            requested: s.quantity,
            available: inventoryMap.get(s.name) ?? 0,
          })),
        },
        { status: 422 }
      );
    }
  }

  const task = await prisma.task.create({
    data: {
      title,
      description: description ?? null,
      deliveryAddress,
      assignedDriverId,
      createdByManagerId: session.user.id,
      taskType,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      ...(items && items.length > 0
        ? { items: { create: items.map((i) => ({ name: i.name, quantity: i.quantity })) } }
        : {}),
    },
    select: { id: true, title: true, status: true },
  });

  // WhatsApp notification — fire-and-forget, never blocks task creation
  if (driver.phone) {
    const itemsText = items && items.length > 0
      ? `\nפריטי משלוח:\n${items.map((i) => `• ${i.name}: ${i.quantity}`).join("\n")}`
      : "";
    const schedText = scheduledFor
      ? `\nמועד: ${new Date(scheduledFor).toLocaleString("he-IL")}`
      : "";
    const msg = `📦 משימה חדשה שובצה אליך!\n\n${title}\nכתובת: ${deliveryAddress}${itemsText}${schedText}`;
    sendWhatsApp(driver.phone, msg).catch(() => {});
  }

  return NextResponse.json(task, { status: 201 });
}
