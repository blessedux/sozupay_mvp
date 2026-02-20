import { getHorizon } from "./server";

const STELLAR_EXPERT_BASE =
  process.env.STELLAR_NETWORK === "public"
    ? "https://stellar.expert/explorer/public"
    : "https://stellar.expert/explorer/testnet";

export interface TransactionRow {
  id: string;
  date: string;
  amount: string;
  type: "incoming" | "payout" | "yield" | "fee";
  source: string;
  status: "completed" | "pending" | "failed";
  stellarExpertUrl: string;
}

export function stellarExpertTxUrl(txHash: string): string {
  return `${STELLAR_EXPERT_BASE}/tx/${txHash}`;
}

export async function getTransactions(
  publicKey: string,
  limit: number = 20
): Promise<TransactionRow[]> {
  const server = getHorizon();
  const rows: TransactionRow[] = [];
  try {
    const payments = await server
      .payments()
      .forAccount(publicKey)
      .limit(limit)
      .order("desc")
      .call();

    for (const p of payments.records) {
      const id = p.id ?? p.transaction_hash ?? "";
      const rawDate: unknown = (p as { created_at?: unknown }).created_at;
      const date =
        rawDate instanceof Date
          ? rawDate.toISOString()
          : String(rawDate ?? "");
      let amount = "0";
      let type: TransactionRow["type"] = "incoming";

      if (p.type === "payment" && "amount" in p) {
        amount = (p as { amount: string }).amount;
        type =
          "to" in p && (p as { to: string }).to === publicKey
            ? "incoming"
            : "payout";
      }

      rows.push({
        id,
        date,
        amount,
        type,
        source: "stellar",
        status: "completed",
        stellarExpertUrl: stellarExpertTxUrl(p.transaction_hash),
      });
    }
  } catch {
    // Return empty on error (e.g. account not found)
  }
  return rows;
}
