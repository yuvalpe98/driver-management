import { requireAuth, requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { createCatalogItemSchema } from "@/lib/validations";
import { NextResponse } from "next/server";

// GET /api/catalog — both roles can read (drivers need the list to select from)
// ?category=INVENTORY or ?category=EQUIPMENT to filter
export async function GET(req: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const where =
    category === "INVENTORY" || category === "EQUIPMENT"
      ? { category: category as "INVENTORY" | "EQUIPMENT" }
      : {};

  const items = await prisma.catalogItem.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(items);
}

// POST /api/catalog — MANAGER only
export async function POST(req: Request) {
  const { error } = await requireRole("MANAGER");
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = createCatalogItemSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });

  const { name, category, unit } = parsed.data;

  const existing = await prisma.catalogItem.findUnique({ where: { name } });
  if (existing)
    return NextResponse.json({ error: "פריט עם שם זה כבר קיים בקטלוג" }, { status: 409 });

  const item = await prisma.catalogItem.create({
    data: { name, category, unit: unit ?? null },
  });

  return NextResponse.json(item, { status: 201 });
}
