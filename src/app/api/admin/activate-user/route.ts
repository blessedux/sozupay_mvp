import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getUserByPrivyId, setUserAllowed } from "@/lib/db/users";
import { fundClassicAccount, isClassicAccount } from "@/lib/stellar/fund";

function isAdmin(level: string) {
  return level === "admin" || level === "super_admin";
}

/**
 * POST /api/admin/activate-user – set allowed=true and fund the user's wallet (admin/super_admin only).
 * Body: { privy_user_id: string }
 * If the user has a classic Stellar account (G...), we submit a createAccount transaction to fund it.
 * Smart accounts (C...) require a separate Soroban flow (see docs/smart-accounts.md).
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const currentUser = await getUserByPrivyId(session.id);
  if (!currentUser || !isAdmin(currentUser.admin_level)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const privyUserId =
    typeof body.privy_user_id === "string" ? body.privy_user_id.trim() : null;
  if (!privyUserId) {
    return NextResponse.json(
      { error: "Missing privy_user_id" },
      { status: 400 }
    );
  }

  const updated = await setUserAllowed(privyUserId, true);
  if (!updated) {
    return NextResponse.json(
      { error: "User not found or update failed" },
      { status: 404 }
    );
  }

  let fundTxHash: string | null = null;
  if (updated.stellar_public_key && isClassicAccount(updated.stellar_public_key)) {
    try {
      fundTxHash = await fundClassicAccount(updated.stellar_public_key);
    } catch (e) {
      console.error("[admin/activate-user] fund failed:", e);
      return NextResponse.json(
        {
          error: "User allowed but funding failed. Ensure STELLAR_FUNDER_SECRET is set and the funder has XLM.",
          details: e instanceof Error ? e.message : String(e),
        },
        { status: 502 }
      );
    }
  }

  return NextResponse.json({
    ok: true,
    user: updated,
    funded: !!fundTxHash,
    fund_tx_hash: fundTxHash ?? undefined,
  });
}
