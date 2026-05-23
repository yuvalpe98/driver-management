import { requireRole, requireLabAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createLabPartSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

// GET /api/lab/parts — accessible by LAB_USER (for the release form) and MANAGER
export async function GET() {
  const { error } = await requireLabAccess();
  if (error) return error;

  const parts = await prisma.labPart.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, isActive: true, createdAt: true },
  });

  return NextResponse.json(parts);
}

// POST /api/lab/parts — MANAGER only
export async function POST(req: Request) {
  const { error } = await requireRole("MANAGER");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = createLabPartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
  }

  const existing = await prisma.labPart.findFirst({
    where: { name: { equals: parsed.data.name, mode: "insensitive" } },
  });
  if (existing) {
    return NextResponse.json({ error: "חלק עם שם זה כבר קיים" }, { status: 409 });
  }

  const part = await prisma.labPart.create({
    data: { name: parsed.data.name },
    select: { id: true, name: true, isActive: true, createdAt: true },
  });

  return NextResponse.json(part, { status: 201 });
}
