import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, username: true, phone: true, role: true },
  });

  if (!user) redirect("/login");

  return (
    <div className="max-w-lg space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">הפרופיל שלי</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          שם משתמש: <span className="font-medium text-slate-700 dark:text-slate-300">{user.username}</span>
        </p>
      </div>

      <ProfileForm name={user.name} phone={user.phone} />
    </div>
  );
}
