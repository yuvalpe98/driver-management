import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("MANAGER");
  if (error) return error;

  const { id } = await params;

  const driver = await prisma.user.findUnique({
    where: { id, role: "DRIVER" },
    select: {
      id: true, name: true, email: true, phone: true, isActive: true, createdAt: true,
      assignedTasks: {
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, status: true, createdAt: true },
      },
    },
  });

  if (!driver) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  return NextResponse.json(driver);
}

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("MANAGER");
  if (error) return error;

  const { id } = await params;

  const driver = await prisma.user.findUnique({ where: { id, role: "DRIVER" } });
  if (!driver) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  const updated = await prisma.user.update({
    where: { id },
    data: { isActive: !driver.isActive },
    select: { id: true, isActive: true },
  });

  return NextResponse.json(updated);
}
