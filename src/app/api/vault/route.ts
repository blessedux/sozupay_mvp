import { NextResponse } from "next/server";
import { getDashboardBalancePublicKey } from "@/lib/wallet-resolve";
import { getUsdcBalance } from "@/lib/stellar/balance";

/**
 * Vault view: balance in vault, APY, accrued yield.
 * Uses org disbursement wallet when user has an org with one; else user wallet.
 * Actual vault protocol integration is per separate vault spec; here we return placeholder/on-chain balance.
 */
export async function GET() {
  const publicKey = await getDashboardBalancePublicKey();
  if (!publicKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const balance = await getUsdcBalance(publicKey);
  return NextResponse.json({
    balanceInVault: balance,
    apy: "0",
    accruedYield: "0",
    rateSource: "Vault protocol (placeholder until vault spec integrated)",
  });
}
