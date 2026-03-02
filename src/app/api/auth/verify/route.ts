import { NextRequest, NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/app-url";
import { setSession } from "@/lib/auth/session";

/**
 * Verify magic link token and set session. Redirect to dashboard.
 * Dev: accepts token + email query params to create session without email delivery.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const baseUrl = getAppBaseUrl(request);

  if (token && email) {
    await setSession({
      id: `user-${email.replace(/[^a-z0-9]/gi, "-")}`,
      email: decodeURIComponent(email),
      twoFactorEnabled: false,
    });
    return NextResponse.redirect(`${baseUrl}/auth/success`);
  }

  return NextResponse.redirect(`${baseUrl}/?error=invalid_link`);
}
