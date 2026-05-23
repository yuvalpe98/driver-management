import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createDriverSchema } from "@/lib/validations";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function GET() {
  const { error, session } = await requireRole("MANAGER");
  if (error || !session) return error;

  const drivers = await prisma.user.findMany({
    where: { role: "DRIVER", isActive: true },
    select: { id: true, name: true, username: true, phone: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(drivers);
}

export async function POST(req: Request) {
  const { error, session } = await requireRole("MANAGER");
  if (error || !session) return error;

  const body = await req.json().catch(() => null);
  const parsed = createDriverSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
  }

  const { name, username, password, phone, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "שם המשתמש כבר קיים במערכת" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      username,
      passwordHash,
      role: role ?? "DRIVER",
      phone: role === "LAB_USER" ? null : (phone ?? null),
    },
    select: { id: true, name: true, username: true, role: true },
  });

  return NextResponse.json(user, { status: 201 });
}
