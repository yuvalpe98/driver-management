import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createTaskSchema } from "@/lib/validations";
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

  const { title, description, deliveryAddress, assignedDriverId, scheduledFor } = parsed.data;

  const driverExists = await prisma.user.findUnique({
    where: { id: assignedDriverId, role: "DRIVER", isActive: true },
  });
  if (!driverExists) {
    return NextResponse.json({ error: "הנהג לא נמצא" }, { status: 404 });
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      deliveryAddress,
      assignedDriverId,
      createdByManagerId: session.user.id,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
    },
    select: { id: true, title: true, status: true },
  });

  return NextResponse.json(task, { status: 201 });
}
