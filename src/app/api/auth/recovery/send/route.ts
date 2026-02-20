import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

/**
 * Simple recovery: send email-based or one-click backup restore link.
 * In production, send email with time-limited token; user clicks to restore access.
 */
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Placeholder: in production, generate token, store with expiry, send email.
  return NextResponse.json({
    message: "Recovery link would be sent to your email",
    email: session.email,
  });
}
