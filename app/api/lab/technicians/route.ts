import { requireRole, requireLabAccess } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createLabTechnicianSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

// GET /api/lab/technicians
// Returns all active technicians — accessible by both LAB_USER (for the release form) and MANAGER.
export async function GET() {
  const { error } = await requireLabAccess();
  if (error) return error;

  const technicians = await prisma.labTechnician.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, isActive: true, createdAt: true },
  });

  return NextResponse.json(technicians);
}

// POST /api/lab/technicians — MANAGER only
export async function POST(req: Request) {
  const { error } = await requireRole("MANAGER");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = createLabTechnicianSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
  }

  const existing = await prisma.labTechnician.findFirst({
    where: { name: { equals: parsed.data.name, mode: "insensitive" } },
  });
  if (existing) {
    return NextResponse.json({ error: "טכנאי עם שם זה כבר קיים" }, { status: 409 });
  }

  const technician = await prisma.labTechnician.create({
    data: { name: parsed.data.name },
    select: { id: true, name: true, isActive: true, createdAt: true },
  });

  return NextResponse.json(technician, { status: 201 });
}
