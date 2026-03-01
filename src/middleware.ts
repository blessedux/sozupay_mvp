import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Mock auth: no redirects to login. All routes allowed. Auth to be implemented later. */
const AUTH_MOCK =
  process.env.AUTH_MOCK === "true" ||
  (process.env.AUTH_MOCK !== "false" && process.env.NODE_ENV === "development");

export function middleware(request: NextRequest) {
  const session = request.cookies.get("sozupay_session")?.value;
  const isLogin = request.nextUrl.pathname.startsWith("/login");
  const isAuthApi =
    request.nextUrl.pathname.startsWith("/api/auth/verify") ||
    request.nextUrl.pathname.startsWith("/api/auth/send-link");

  if (isAuthApi) return NextResponse.next();

  // Mock auth: never redirect to login; allow /dashboard and all routes through
  if (AUTH_MOCK) {
    if (isLogin && session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Real auth (when AUTH_MOCK is off): protect dashboard
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isAuthSuccess = request.nextUrl.pathname === "/auth/success";
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
