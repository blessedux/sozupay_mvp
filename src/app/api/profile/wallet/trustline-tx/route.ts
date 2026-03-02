/**
 * GET /api/profile/wallet/trustline-tx
 * Returns an unsigned USDC changeTrust transaction for the current user's classic (G) wallet.
 * User must sign and submit client-side. Only for G accounts; smart accounts (C) use contract logic.
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getUserByPrivyId } from "@/lib/db/users";
import { isClassicAccount } from "@/lib/stellar/fund";
import { buildUsdcChangeTrustTx } from "@/lib/stellar/trustline";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByPrivyId(session.id);
  if (!user?.stellar_public_key) {
    return NextResponse.json(
      { error: "No wallet registered" },
      { status: 400 }
    );
  }

  if (!isClassicAccount(user.stellar_public_key)) {
    return NextResponse.json(
      { error: "Trustline is for classic (G) accounts only; use your smart account flow for C" },
      { status: 400 }
    );
  }

  try {
    const envelopeXdr = await buildUsdcChangeTrustTx(user.stellar_public_key);
    const network =
      process.env.STELLAR_NETWORK === "public" ? "public" : "testnet";
    const laboratoryBase =
      network === "public"
        ? "https://laboratory.stellar.org"
        : "https://laboratory.stellar.org/#explorer?resource=accounts&endpoint=single&network=test";
    return NextResponse.json({
      envelope_xdr: envelopeXdr,
      network,
      account_id: user.stellar_public_key,
      laboratory_link: `${laboratoryBase}`,
    });
  } catch (e) {
    console.error("[trustline-tx]", e);
    return NextResponse.json(
      {
        error: "Failed to build trustline transaction",
        details: e instanceof Error ? e.message : String(e),
      },
      { status: 502 }
    );
  }
}
