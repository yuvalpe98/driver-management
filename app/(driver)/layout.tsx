import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "DRIVER") redirect("/manager/dashboard");
  // layout wraps /driver/* routes
  return <>{children}</>;
}
