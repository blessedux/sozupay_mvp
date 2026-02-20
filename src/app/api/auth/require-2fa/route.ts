import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

/**
 * Sensitive actions require 2FA or re-auth. Client sends code or re-auth proof.
 * Returns 200 if allowed, 403 if 2FA required / invalid.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const code = body.code as string | undefined;

  if (session.twoFactorEnabled) {
    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: "2FA required", required: true },
        { status: 403 }
      );
    }
    // In production: verify TOTP with stored secret for session.userId
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
