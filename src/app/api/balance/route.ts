import { NextResponse } from "next/server";
import { getDashboardBalancePublicKey } from "@/lib/wallet-resolve";
import { getUsdcBalance } from "@/lib/stellar/balance";

const FIAT_RATE_SOURCE = "1 USDC = 1 USD (display rate)";

/**
 * USDC balance for the dashboard. Uses org disbursement wallet when user has an org with one; else user wallet.
 */
export async function GET() {
  const publicKey = await getDashboardBalancePublicKey();
  if (!publicKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [usdcBalance, inVault] = await Promise.all([
    getUsdcBalance(publicKey),
    Promise.resolve("0"), // Vault balance from vault spec when integrated
  ]);

  const num = parseFloat(usdcBalance) || 0;
  const fiatAmount = num; // 1:1 for USDC/USD display
  const rateSource = FIAT_RATE_SOURCE;

  return NextResponse.json({
    usdc: usdcBalance,
    available: usdcBalance,
    inVault,
    fiatAmount: fiatAmount.toFixed(2),
    fiatCurrency: "USD",
    rateSource,
  });
}
