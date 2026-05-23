import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Root page — dispatches to the correct dashboard based on the user's role.
 * Also serves as the post-login landing target so the login page doesn't
 * need to hard-code a role-specific URL.
 */
export default async function Home() {
  const session = await auth();
  if (!session) redirect("/login");

  switch (session.user.role) {
    case "MANAGER":
      redirect("/manager/dashboard");
    case "DRIVER":
      redirect("/driver/dashboard");
    case "LAB_USER":
      redirect("/lab/release");
    default:
      redirect("/login");
  }
}
