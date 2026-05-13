import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { updateDriverSchema } from "@/lib/validations";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("MANAGER");
  if (error) return error;

  const { id } = await params;

  const driver = await prisma.user.findUnique({ where: { id, role: "DRIVER" } });
  if (!driver) return NextResponse.json({ error: "לא נמצא" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateDriverSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
  }

  const { name, email, phone, password, isActive } = parsed.data;

  // If toggling isActive only (legacy behavior from ToggleDriverButton)
  if (isActive !== undefined && !name && !email && !phone && !password) {
    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, isActive: true },
    });
    return NextResponse.json(updated);
  }

  // Check email uniqueness if email is changing
  if (email && email !== driver.email) {
    const conflict = await prisma.user.findUnique({ where: { email } });
    if (conflict) {
      return NextResponse.json({ error: "כתובת האימייל כבר בשימוש" }, { status: 409 });
    }
  }

  const data: Record<string, unknown> = {};
  if (name) data["name"] = name;
  if (email) data["email"] = email;
  if (phone !== undefined) data["phone"] = phone || null;
  if (isActive !== undefined) data["isActive"] = isActive;
  if (password) data["passwordHash"] = await bcrypt.hash(password, 12);

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, phone: true, isActive: true },
  });

  return NextResponse.json(updated);
}
