import { NextRequest, NextResponse } from "next/server";
import { getDashboardBalancePublicKey } from "@/lib/wallet-resolve";
import { getTransactions } from "@/lib/stellar/transactions";
import { getSession } from "@/lib/auth/session";

/**
 * Recent transactions for the organization's disbursement wallet.
 * Dashboard is organization-centric; returns empty list when org has no wallet yet.
 */
export async function GET(request: NextRequest) {
  const publicKey = await getDashboardBalancePublicKey();
  if (!publicKey) {
    const session = await getSession();
    if (session) {
      return NextResponse.json({ transactions: [] });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);

  const list = await getTransactions(publicKey, limit);
  return NextResponse.json({ transactions: list });
}
