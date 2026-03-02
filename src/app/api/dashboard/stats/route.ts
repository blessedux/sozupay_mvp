import { NextResponse } from "next/server";
import { getDashboardBalancePublicKey } from "@/lib/wallet-resolve";
import { getUsdcBalance } from "@/lib/stellar/balance";
import { getTransactions } from "@/lib/stellar/transactions";

/**
 * Aggregated business finance stats for the dashboard.
 * Uses the organization disbursement wallet balance when the user has an org with one; otherwise user wallet.
 * When authenticated but no wallet yet, returns zeros so the dashboard still loads.
 */
export async function GET() {
  const publicKey = await getDashboardBalancePublicKey();
  if (!publicKey) {
    const { getSession } = await import("@/lib/auth/session");
    const session = await getSession();
    if (session) {
      return NextResponse.json({
        balanceUsd: "0.00",
        transactionCount: 0,
        apyPercent: 0,
        creditAvailableUsd: "0.00",
        currency: "USD",
      });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [balance, transactions] = await Promise.all([
    getUsdcBalance(publicKey),
    getTransactions(publicKey, 500),
  ]);

  const balanceNum = parseFloat(balance) || 0;

  // APY: placeholder until vault protocol is integrated (vault API returns "0")
  const apyPercent = 0;

  // Credit available: placeholder heuristic (e.g. up to 50% of balance as credit line).
  const creditAvailableNum = Math.max(0, balanceNum * 0.5);

  return NextResponse.json({
    balanceUsd: balanceNum.toFixed(2),
    transactionCount: transactions.length,
    apyPercent,
    creditAvailableUsd: creditAvailableNum.toFixed(2),
    currency: "USD",
  });
}
