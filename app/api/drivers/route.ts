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
    select: { id: true, name: true, email: true, phone: true },
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

  const { name, email, password, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "כתובת האימייל כבר קיימת במערכת" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const driver = await prisma.user.create({
    data: { name, email, passwordHash, role: "DRIVER", phone: phone ?? null },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json(driver, { status: 201 });
}
