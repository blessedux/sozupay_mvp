/**
 * Build a USDC changeTrust transaction for a classic account (G).
 * The transaction must be signed by the account owner (client-side).
 * Server-only; used to return an unsigned envelope for the user to sign.
 */

import {
  Asset,
  Operation,
  TransactionBuilder,
  Networks,
} from "@stellar/stellar-sdk";
import { getHorizon } from "./server";
import { getUsdcIssuer } from "./balance";

function getNetworkPassphrase(): string {
  return process.env.STELLAR_NETWORK === "public"
    ? Networks.PUBLIC
    : Networks.TESTNET;
}

/**
 * Build an unsigned ChangeTrust transaction for USDC for the given account (G...).
 * The account must exist (be funded). Caller submits the returned envelope after signing.
 * @param accountId - Classic Stellar account public key (G...)
 * @returns Unsigned transaction (envelope) as base64 XDR
 */
export async function buildUsdcChangeTrustTx(
  accountId: string
): Promise<string> {
  const horizon = getHorizon();
  const networkPassphrase = getNetworkPassphrase();
  const issuer = getUsdcIssuer();
  const usdcAsset = new Asset("USDC", issuer);

  const account = await horizon.loadAccount(accountId);

  const tx = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase,
  })
    .addOperation(
      Operation.changeTrust({
        asset: usdcAsset,
        limit: "922337203685.4775807", // max
      })
    )
    .setTimeout(30)
    .build();

  return tx.toEnvelope().toXDR("base64");
}

/**
 * Check if a classic account (G) has a USDC trustline (Circle issuer for current network).
 */
export async function hasUsdcTrustline(accountId: string): Promise<boolean> {
  const horizon = getHorizon();
  const issuer = getUsdcIssuer();
  try {
    const account = await horizon.accounts().accountId(accountId).call();
    const hasTrustline = account.balances.some(
      (b) =>
        b.asset_type !== "native" &&
        "asset_issuer" in b &&
        b.asset_issuer === issuer &&
        "asset_code" in b &&
        b.asset_code === "USDC"
    );
    return hasTrustline;
  } catch {
    return false;
  }
}
