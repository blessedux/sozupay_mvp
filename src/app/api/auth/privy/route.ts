import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@privy-io/node";
import { setSession } from "@/lib/auth/session";
import { getOrCreateUserByPrivy } from "@/lib/db/users";

/**
 * Sync Privy auth to our session.
 * Client sends Authorization: Bearer <accessToken> and body { email }.
 * We verify the token and set our session cookie.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return NextResponse.json(
      { error: "Missing Authorization Bearer token" },
      { status: 401 }
    );
  }

  const appId =
    process.env.PRIVY_APP_ID ?? process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const verificationKey = process.env.PRIVY_VERIFICATION_KEY;

  if (!appId || !verificationKey) {
    return NextResponse.json(
      {
        error:
          "Privy not configured. Set PRIVY_APP_ID (or NEXT_PUBLIC_PRIVY_APP_ID) and PRIVY_VERIFICATION_KEY.",
      },
      { status: 503 }
    );
  }

  let claims;
  try {
    claims = await verifyAccessToken({
      access_token: token,
      app_id: appId,
      verification_key: verificationKey,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const email =
    typeof body.email === "string" && body.email.trim()
      ? body.email.trim()
      : `privy-${claims.user_id.slice(-8)}`;

  try {
    const user = await getOrCreateUserByPrivy(claims.user_id, email);

    await setSession({
      id: user.privy_user_id,
      email: user.email,
      twoFactorEnabled: false,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create or load user";
    console.error("[auth/privy]", message, err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
