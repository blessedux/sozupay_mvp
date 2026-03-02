/**
 * Fund a new Stellar account (classic G account) so it exists on the ledger.
 * Uses a backend funder keypair to submit a createAccount operation.
 * For smart accounts (C), funding is handled separately via Soroban.
 */

import {
  Keypair,
  Operation,
  TransactionBuilder,
  Horizon,
  Networks,
} from "@stellar/stellar-sdk";

const DEFAULT_STARTING_BALANCE = "2"; // XLM (enough for 1 base reserve + 1 for ops)

function getNetworkPassphrase(): string {
  return process.env.STELLAR_NETWORK === "public"
    ? Networks.PUBLIC
    : Networks.TESTNET;
}

/**
 * Returns true if the address is a classic Stellar account (G...).
 * Contract/smart account addresses start with C.
 */
export function isClassicAccount(address: string): boolean {
  return typeof address === "string" && address.startsWith("G");
}

/**
 * Fund a classic account (G...) by submitting a createAccount transaction.
 * Requires STELLAR_FUNDER_SECRET to be set.
 * @param destinationAccountId - The public key (G...) of the account to create and fund
 * @param startingBalance - XLM amount (default 2)
 * @returns Transaction hash or throws on error
 */
export async function fundClassicAccount(
  destinationAccountId: string,
  startingBalance: string = DEFAULT_STARTING_BALANCE,
  server?: Horizon.Server
): Promise<string> {
  if (!isClassicAccount(destinationAccountId)) {
    throw new Error(
      "Only classic accounts (G...) can be funded with createAccount. Smart accounts (C...) use a different flow."
    );
  }

  const funderSecret = process.env.STELLAR_FUNDER_SECRET;
  if (!funderSecret?.trim()) {
    throw new Error(
      "STELLAR_FUNDER_SECRET is not set. Set it to the secret key of the account that will fund new users."
    );
  }

  let keypair: Keypair;
  try {
    keypair = Keypair.fromSecret(funderSecret.trim());
  } catch {
    throw new Error("STELLAR_FUNDER_SECRET is not a valid Stellar secret key.");
  }

  const horizon =
    server ?? (await import("./server").then((m) => m.getHorizon()));
  if (!horizon) throw new Error("Horizon server not available");
  const networkPassphrase = getNetworkPassphrase();

  const sourceAccount = await horizon.loadAccount(keypair.publicKey());

  const txBuilder = new TransactionBuilder(sourceAccount, {
    fee: "100",
    networkPassphrase,
  })
    .addOperation(
      Operation.createAccount({
        destination: destinationAccountId,
        startingBalance,
      })
    )
    .setTimeout(30);

  const transaction = txBuilder.build();
  transaction.sign(keypair);

  const result = await horizon.submitTransaction(transaction);
  if (result.successful) {
    return result.hash;
  }
  const codes = (result as { result_codes?: unknown }).result_codes;
  throw new Error(
    codes != null ? `Transaction failed: ${JSON.stringify(codes)}` : "Transaction failed"
  );
}
