import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Navbar from "@/components/manager/Navbar";

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "MANAGER") redirect("/driver/dashboard");

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar userName={session.user.name ?? "מנהל"} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
