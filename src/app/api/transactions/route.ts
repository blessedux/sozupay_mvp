import { NextRequest, NextResponse } from "next/server";
import { getDashboardBalancePublicKey } from "@/lib/wallet-resolve";
import { getTransactions } from "@/lib/stellar/transactions";

/**
 * Recent transactions for the dashboard. Uses org disbursement wallet when user has an org with one; else user wallet.
 */
export async function GET(request: NextRequest) {
  const publicKey = await getDashboardBalancePublicKey();
  if (!publicKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);

  const list = await getTransactions(publicKey, limit);
  return NextResponse.json({ transactions: list });
}
