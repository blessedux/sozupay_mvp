import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("sozupay_session")?.value;
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isAuthSuccess = request.nextUrl.pathname === "/auth/success";
  const isLogin = request.nextUrl.pathname.startsWith("/login");
  const isAuthApi =
    request.nextUrl.pathname.startsWith("/api/auth/verify") ||
    request.nextUrl.pathname.startsWith("/api/auth/send-link");

  if (isAuthApi) return NextResponse.next();
  if ((isDashboard || isAuthSuccess) && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isLogin && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/success", "/login", "/api/auth/verify", "/api/auth/send-link"],
};
