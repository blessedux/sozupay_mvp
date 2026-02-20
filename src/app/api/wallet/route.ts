import { NextResponse } from "next/server";
import { getWalletPublicKey } from "@/lib/wallet-resolve";

/**
 * Get or create wallet for current user. Key handling is backend-only (separate security spec).
 * Returns public key/address for display and audit; no secret material.
 */
export async function GET() {
  const publicKey = await getWalletPublicKey();
  if (!publicKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    publicKey,
    network: process.env.STELLAR_NETWORK ?? "testnet",
  });
}
