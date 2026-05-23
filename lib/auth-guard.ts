import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  }
  return { error: null, session };
}

export async function requireRole(role: Role) {
  const { error, session } = await requireAuth();
  if (error || !session) return { error: error ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  if (session.user.role !== role) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

/** Allow access when the caller has ANY of the listed roles. */
export async function requireAnyRole(roles: Role[]) {
  const { error, session } = await requireAuth();
  if (error || !session) return { error: error ?? NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
  if (!roles.includes(session.user.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

/** Convenience: accessible by both LAB_USER and MANAGER. */
export async function requireLabAccess() {
  return requireAnyRole(["LAB_USER", "MANAGER"]);
}
