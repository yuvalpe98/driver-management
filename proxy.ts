import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session;

  const isDriverRoute = nextUrl.pathname.startsWith("/driver");
  const isManagerRoute = nextUrl.pathname.startsWith("/manager");
  const isLoginPage = nextUrl.pathname === "/login";

  if (isLoginPage && isLoggedIn) {
    const dest = session.user.role === "MANAGER" ? "/manager/dashboard" : "/driver/dashboard";
    return NextResponse.redirect(new URL(dest, nextUrl));
  }

  if (!isLoggedIn && (isDriverRoute || isManagerRoute)) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isDriverRoute && session?.user.role !== "DRIVER") {
    return NextResponse.redirect(new URL("/manager/dashboard", nextUrl));
  }

  if (isManagerRoute && session?.user.role !== "MANAGER") {
    return NextResponse.redirect(new URL("/driver/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
