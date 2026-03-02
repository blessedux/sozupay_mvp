/**
 * GET /api/profile/wallet/trustline-status
 * Returns whether the current user's classic (G) wallet has a USDC trustline.
 * Used to show "Add USDC trustline" step after activation for G accounts.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getUserByPrivyId } from "@/lib/db/users";
import { isClassicAccount } from "@/lib/stellar/fund";
import { hasUsdcTrustline } from "@/lib/stellar/trustline";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByPrivyId(session.id);
  if (!user?.stellar_public_key) {
    return NextResponse.json(
      { needs_trustline: false, has_trustline: false, reason: "no_wallet" }
    );
  }

  if (!isClassicAccount(user.stellar_public_key)) {
    return NextResponse.json(
      { needs_trustline: false, has_trustline: true, reason: "smart_account" }
    );
  }

  const hasTrustline = await hasUsdcTrustline(user.stellar_public_key);
  return NextResponse.json({
    needs_trustline: !hasTrustline,
    has_trustline: hasTrustline,
    account_id: user.stellar_public_key,
  });
}
