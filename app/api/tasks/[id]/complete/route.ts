import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { completeTaskSchema } from "@/lib/validations";
import { sendPush } from "@/lib/push";
import { sendWhatsApp } from "@/lib/whatsapp";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireRole("DRIVER");
  if (error || !session) return error;

  const { id } = await params;
  const driverId = session.user.id;

  // ── Load task (ownership check built into where clause) ─────────────────────
  const task = await prisma.task.findUnique({
    where: { id, assignedDriverId: driverId },
    select: {
      id: true,
      title: true,
      status: true,
      createdByManagerId: true,
      createdByManager: { select: { phone: true } },
    },
  });

  if (!task) return NextResponse.json({ error: "המשימה לא נמצאה" }, { status: 404 });
  if (task.status === "COMPLETED") return NextResponse.json({ error: "המשימה כבר הושלמה" }, { status: 409 });
  if (task.status === "CANCELLED") return NextResponse.json({ error: "לא ניתן להשלים משימה שבוטלה" }, { status: 409 });

  // ── Parse & validate body ────────────────────────────────────────────────────
  const body = await req.json().catch(() => null);
  const parsed = completeTaskSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  const { recipientName, signatureBase64, serials } = parsed.data;

  // ── Load task items ──────────────────────────────────────────────────────────
  const taskItems = await prisma.taskItem.findMany({ where: { taskId: id } });

  // ── Serial number validation (when serials are provided) ─────────────────────
  if (serials && serials.length > 0) {
    const taskItemMap = new Map(taskItems.map((i) => [i.id, i]));

    // 1. Every provided taskItemId must belong to this task
    const foreignIds = serials.filter((g) => !taskItemMap.has(g.taskItemId));
    if (foreignIds.length > 0) {
      return NextResponse.json({ error: "פריט משימה לא תקין" }, { status: 400 });
    }

    // 2. Serial count must exactly match the task item's quantity
    const mismatches = serials
      .map((g) => ({ item: taskItemMap.get(g.taskItemId)!, provided: g.serials.length }))
      .filter(({ item, provided }) => provided !== item.quantity);

    if (mismatches.length > 0) {
      return NextResponse.json(
        {
          error: "מספר הסריאלים אינו תואם את הכמות הנדרשת",
          mismatches: mismatches.map(({ item, provided }) => ({
            name: item.name,
            required: item.quantity,
            provided,
          })),
        },
        { status: 400 }
      );
    }

    // 3. No duplicate serial numbers within this single request
    const allSerials = serials.flatMap((g) => g.serials);
    const uniqueSet = new Set(allSerials);
    if (uniqueSet.size !== allSerials.length) {
      return NextResponse.json(
        { error: "מספרי סידורי כפולים בתוך הבקשה" },
        { status: 400 }
      );
    }

    // 4. No serial numbers already recorded in the DB (global uniqueness guard)
    const existing = await prisma.scannedSerial.findMany({
      where: { serialNumber: { in: allSerials } },
      select: { serialNumber: true },
    });
    if (existing.length > 0) {
      return NextResponse.json(
        {
          error: "מספרי סידורי כבר קיימים במערכת",
          duplicates: existing.map((s) => s.serialNumber),
        },
        { status: 409 }
      );
    }
  }

  // ── Prepare atomic write ─────────────────────────────────────────────────────
  const signatureImageUrl = signatureBase64.startsWith("data:")
    ? signatureBase64
    : `data:image/png;base64,${signatureBase64}`;

  const now = new Date();
  // Pre-generate the TaskCompletion ID so ScannedSerial records can reference it
  // in the same transaction without a second round-trip.
  const completionId = randomUUID();

  // ── Atomic transaction ───────────────────────────────────────────────────────
  await prisma.$transaction([
    // 1. Create completion record (with pre-determined ID)
    prisma.taskCompletion.create({
      data: { id: completionId, taskId: id, recipientName, signatureImageUrl, completedAt: now },
    }),

    // 2. Mark task COMPLETED
    prisma.task.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: now },
    }),

    // 3. Persist scanned serial numbers
    ...(serials ?? []).flatMap((group) =>
      group.serials.map((serialNumber) =>
        prisma.scannedSerial.create({
          data: {
            serialNumber,
            taskItemId: group.taskItemId,
            taskCompletionId: completionId,
          },
        })
      )
    ),

    // 4. Deduct delivered quantities from driver's inventory.
    //    Uses catalogItem.name match (TaskItem.name = catalog item name).
    //    The `quantity: { gte: item.quantity }` guard prevents going negative.
    ...taskItems.map((item) =>
      prisma.inventoryItem.updateMany({
        where: {
          driverId,
          quantity: { gte: item.quantity },
          catalogItem: { name: item.name },
        },
        data: { quantity: { decrement: item.quantity } },
      })
    ),
  ]);

  // ── Notify manager (fire-and-forget) ─────────────────────────────────────────
  const driverName = session.user.name;
  const managerPhone = task.createdByManager.phone;

  sendPush(task.createdByManagerId, {
    title: "משימה הושלמה",
    body: `${task.title} — נמסר ל${recipientName}`,
    url: `/manager/tasks/${id}`,
  }).catch(() => {});

  if (managerPhone) {
    sendWhatsApp(
      managerPhone,
      `✅ משימה הושלמה!\n📋 משימה: ${task.title}\n🚗 נהג: ${driverName}\n👤 נמסר ל: ${recipientName}\n🔗 לפרטים: https://driver-management-production-f9f1.up.railway.app/manager/tasks/${id}`
    ).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
