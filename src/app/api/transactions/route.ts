import { NextRequest, NextResponse } from "next/server";
import { getWalletPublicKey } from "@/lib/wallet-resolve";
import { getTransactions } from "@/lib/stellar/transactions";

export async function GET(request: NextRequest) {
  const publicKey = await getWalletPublicKey();
  if (!publicKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);

  const list = await getTransactions(publicKey, limit);
  return NextResponse.json({ transactions: list });
}
