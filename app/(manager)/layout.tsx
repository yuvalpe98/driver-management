import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "MANAGER") redirect("/driver/dashboard");
  return <>{children}</>;
}
