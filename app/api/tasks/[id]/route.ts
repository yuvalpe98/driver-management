import { requireAuth, requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { updateTaskStatusSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;

  // Build query — drivers can only see their own tasks
  const where =
    session.user.role === "MANAGER"
      ? { id }
      : { id, assignedDriverId: session.user.id }; // SECURITY: ownership enforced here

  const task = await prisma.task.findUnique({
    where,
    select: {
      id: true,
      title: true,
      description: true,
      deliveryAddress: true,
      status: true,
      scheduledFor: true,
      completedAt: true,
      createdAt: true,
      assignedDriver: { select: { name: true } },
      completion: {
        select: { recipientName: true, signatureImageUrl: true, completedAt: true },
      },
    },
  });

  // Return 404 regardless of whether task exists or belongs to someone else
  // to prevent information leakage
  if (!task) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  return NextResponse.json(task);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateTaskStatusSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  const { status } = parsed.data;

  // Drivers can only set IN_PROGRESS; managers can only cancel
  if (session.user.role === "DRIVER" && status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }
  if (session.user.role === "MANAGER" && status !== "CANCELLED") {
    return NextResponse.json({ error: "אין הרשאה" }, { status: 403 });
  }

  const where =
    session.user.role === "MANAGER"
      ? { id }
      : { id, assignedDriverId: session.user.id };

  const task = await prisma.task.findUnique({ where, select: { id: true, status: true } });
  if (!task) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  if (task.status === "COMPLETED" || task.status === "CANCELLED") {
    return NextResponse.json({ error: "לא ניתן לשנות סטטוס זה" }, { status: 409 });
  }

  const updated = await prisma.task.update({
    where: { id: task.id },
    data: { status },
    select: { id: true, status: true },
  });

  return NextResponse.json(updated);
}
