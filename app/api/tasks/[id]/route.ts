import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
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
