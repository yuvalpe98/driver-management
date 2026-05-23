import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DriverNavbar from "@/components/driver/DriverNavbar";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "DRIVER") redirect("/");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <DriverNavbar userName={session.user.name ?? "נהג"} />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </div>
    </div>
  );
}
