import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { updateLabPartSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

// PATCH /api/lab/parts/[id] — rename or toggle isActive
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("MANAGER");
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateLabPartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
  }

  const part = await prisma.labPart.findUnique({ where: { id } });
  if (!part) return NextResponse.json({ error: "חלק לא נמצא" }, { status: 404 });

  // Strip undefined so exactOptionalPropertyTypes doesn't reject the Prisma data shape
  const data = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v !== undefined),
  ) as { name?: string; isActive?: boolean };

  const updated = await prisma.labPart.update({
    where: { id },
    data,
    select: { id: true, name: true, isActive: true, createdAt: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/lab/parts/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireRole("MANAGER");
  if (error) return error;

  const { id } = await params;

  const hasLogs = await prisma.labReleaseLog.findFirst({
    where: { parts: { some: { id } } },
  });
  if (hasLogs) {
    return NextResponse.json(
      { error: "לא ניתן למחוק חלק שנעשה בו שימוש ברשומות שחרור. השבת אותו במקום." },
      { status: 409 },
    );
  }

  await prisma.labPart.delete({ where: { id } });
  return new Response(null, { status: 204 });
}
