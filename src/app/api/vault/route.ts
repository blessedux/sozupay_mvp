import { NextResponse } from "next/server";
import { getDashboardBalancePublicKey } from "@/lib/wallet-resolve";
import { getUsdcBalance } from "@/lib/stellar/balance";
import { getSession } from "@/lib/auth/session";

/**
 * Vault / DeFi allocation for the organization's disbursement wallet.
 * Dashboard is organization-centric. Returns zeros when org has no wallet yet.
 */
export async function GET() {
  const publicKey = await getDashboardBalancePublicKey();
  if (!publicKey) {
    const session = await getSession();
    if (session) {
      return NextResponse.json({
        balanceInVault: "0",
        apy: "0",
        accruedYield: "0",
        rateSource: "Vault protocol (placeholder until vault spec integrated)",
      });
    }
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
