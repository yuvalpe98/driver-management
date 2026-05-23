import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(20).optional(),
  password: z.string().min(8).max(72).optional(),
});

export async function PATCH(req: Request) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const body = await req.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  const { name, phone, password } = parsed.data;
  const data: Record<string, unknown> = {};
  if (name) data["name"] = name;
  if (phone !== undefined) data["phone"] = phone || null;
  if (password) data["passwordHash"] = await bcrypt.hash(password, 12);

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { id: true, name: true, phone: true },
  });

  return NextResponse.json(updated);
}
