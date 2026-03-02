import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const usePrivyAuth = !!PRIVY_APP_ID;

/** When Privy is configured, require session for dashboard. Otherwise use mock in dev. */
const AUTH_MOCK =
  !usePrivyAuth &&
  (process.env.AUTH_MOCK === "true" ||
    (process.env.AUTH_MOCK !== "false" && process.env.NODE_ENV === "development"));

export function middleware(request: NextRequest) {
  const session = request.cookies.get("sozupay_session")?.value;
  const isLogin = request.nextUrl.pathname.startsWith("/login");
  const isAuthApi =
    request.nextUrl.pathname.startsWith("/api/auth/verify") ||
    request.nextUrl.pathname.startsWith("/api/auth/send-link") ||
    request.nextUrl.pathname.startsWith("/api/auth/privy");

  if (isAuthApi) return NextResponse.next();

  // Mock auth (no Privy): allow all routes; redirect to dashboard if logged in and on /login
  if (AUTH_MOCK) {
    if (isLogin && session) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Privy auth (or real auth): protect dashboard and onboarding
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isOnboarding = request.nextUrl.pathname.startsWith("/onboarding");
  const isAuthSuccess = request.nextUrl.pathname === "/auth/success";
  if ((isDashboard || isOnboarding || isAuthSuccess) && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isLogin && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/auth/success", "/login", "/api/auth/verify", "/api/auth/send-link"],
};
