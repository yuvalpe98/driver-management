import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { completeTaskSchema } from "@/lib/validations";
import { uploadSignature } from "@/lib/cloudinary";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireRole("DRIVER");
  if (error || !session) return error;

  const { id } = await params;
  const driverId = session.user.id;

  const task = await prisma.task.findUnique({
    where: { id, assignedDriverId: driverId },
    select: { id: true, status: true },
  });

  if (!task) return NextResponse.json({ error: "המשימה לא נמצאה" }, { status: 404 });
  if (task.status === "COMPLETED") return NextResponse.json({ error: "המשימה כבר הושלמה" }, { status: 409 });
  if (task.status === "CANCELLED") return NextResponse.json({ error: "לא ניתן להשלים משימה שבוטלה" }, { status: 409 });

  const body = await req.json().catch(() => null);
  const parsed = completeTaskSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  const { recipientName, signatureBase64, equipmentUpdates } = parsed.data;

  // Verify all equipment IDs belong to this driver before touching them
  if (equipmentUpdates && equipmentUpdates.length > 0) {
    const ids = equipmentUpdates.map((e) => e.id);
    const owned = await prisma.equipment.count({
      where: { id: { in: ids }, driverId },
    });
    if (owned !== ids.length) {
      return NextResponse.json({ error: "ציוד לא תקין" }, { status: 403 });
    }
  }

  let signatureImageUrl: string;
  try {
    signatureImageUrl = await uploadSignature(signatureBase64);
  } catch {
    return NextResponse.json({ error: "שגיאה בשמירת החתימה" }, { status: 500 });
  }

  const now = new Date();

  // Fetch task items before the transaction
  const taskItems = await prisma.taskItem.findMany({ where: { taskId: id } });

  // Single atomic transaction: task completion + equipment status updates + inventory deduction
  await prisma.$transaction([
    prisma.taskCompletion.create({
      data: { taskId: id, recipientName, signatureImageUrl, completedAt: now },
    }),
    prisma.task.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: now },
    }),
    ...(equipmentUpdates ?? []).map((eq) =>
      prisma.equipment.update({
        where: { id: eq.id },
        data: { status: eq.status },
      })
    ),
    // Deduct each delivered item from driver's inventory (best-effort: floor at 0)
    ...taskItems.map((item) =>
      prisma.inventoryItem.updateMany({
        where: { driverId, name: item.name, quantity: { gte: item.quantity } },
        data: { quantity: { decrement: item.quantity } },
      })
    ),
  ]);

  return NextResponse.json({ success: true });
}
