import { requireRole } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { completeTaskSchema } from "@/lib/validations";
import { uploadSignature } from "@/lib/cloudinary";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error, session } = await requireRole("DRIVER");
  if (error || !session) return error;

  const { id } = await params;

  // Verify task exists and belongs to this driver
  const task = await prisma.task.findUnique({
    where: { id, assignedDriverId: session.user.id },
    select: { id: true, status: true },
  });

  if (!task) {
    return NextResponse.json({ error: "המשימה לא נמצאה" }, { status: 404 });
  }

  if (task.status === "COMPLETED") {
    return NextResponse.json({ error: "המשימה כבר הושלמה" }, { status: 409 });
  }

  if (task.status === "CANCELLED") {
    return NextResponse.json({ error: "לא ניתן להשלים משימה שבוטלה" }, { status: 409 });
  }

  const body = await req.json().catch(() => null);
  const parsed = completeTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
  }

  const { recipientName, signatureBase64 } = parsed.data;

  // Upload signature to Cloudinary — runs on server, credentials never exposed to client
  let signatureImageUrl: string;
  try {
    signatureImageUrl = await uploadSignature(signatureBase64);
  } catch {
    return NextResponse.json({ error: "שגיאה בשמירת החתימה" }, { status: 500 });
  }

  // Atomic transaction: create completion + update task status
  // completedAt is always set by the server — never accepted from client
  const now = new Date();

  await prisma.$transaction([
    prisma.taskCompletion.create({
      data: {
        taskId: id,
        recipientName,
        signatureImageUrl,
        completedAt: now,
      },
    }),
    prisma.task.update({
      where: { id },
      data: { status: "COMPLETED", completedAt: now },
    }),
  ]);

  return NextResponse.json({ success: true });
}
