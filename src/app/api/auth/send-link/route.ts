import { NextRequest, NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/app-url";
import { setSession } from "@/lib/auth/session";

/**
 * Magic link: in production, send email with link containing token.
 * For dev/demo we support ?instant=1 to immediately create session and return redirect URL.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  let email = typeof body.email === "string" ? body.email.trim() : "";
  const instant = body.instant === true;
  const mockAuth =
    process.env.AUTH_MOCK === "true" ||
    (process.env.AUTH_MOCK !== "false" && process.env.NODE_ENV === "development");

  if (!email) email = "demo@sozupay.demo";
  if (!mockAuth && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Valid email required" },
      { status: 400 }
    );
  }

  const token = crypto.randomUUID();
  const baseUrl = getAppBaseUrl(request);

  if (instant || mockAuth) {
    await setSession({
      id: `user-${email.replace(/[^a-z0-9]/gi, "-")}`,
      email,
      twoFactorEnabled: false,
    });
    return NextResponse.json({
      redirect: `${baseUrl}/dashboard`,
      message: "Signed in (instant dev mode)",
    });
  }

  // In production: store token with expiry, send email with link:
  // ${baseUrl}/api/auth/verify?token=${token}
  // For now we return the link in response (dev only)
  return NextResponse.json({
    message: "Magic link would be sent to your email",
    devLink: `${baseUrl}/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`,
  });
}
