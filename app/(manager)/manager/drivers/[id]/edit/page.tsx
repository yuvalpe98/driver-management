import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EditDriverForm from "./EditDriverForm";

export default async function EditDriverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const driver = await prisma.user.findUnique({
    where: { id, role: "DRIVER" },
    select: { id: true, name: true, email: true, phone: true },
  });

  if (!driver) notFound();

  return (
    <div className="max-w-lg">
      <EditDriverForm driver={driver} />
    </div>
  );
}
