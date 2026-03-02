/**
 * Stellar Horizon client – backend only.
 * No key handling in frontend; used for reading account/ledger data.
 * When HORIZON_URL is not set, URL is derived from STELLAR_NETWORK so we
 * always query the same network (testnet vs public) that we use for tx building.
 */

import { Horizon } from "@stellar/stellar-sdk";

const HORIZON_TESTNET = "https://horizon-testnet.stellar.org";
const HORIZON_PUBLIC = "https://horizon.stellar.org";

function getHorizonUrl(): string {
  const explicit = process.env.HORIZON_URL?.trim();
  if (explicit) return explicit;
  return process.env.STELLAR_NETWORK === "public"
    ? HORIZON_PUBLIC
    : HORIZON_TESTNET;
}

const horizonUrl = getHorizonUrl();

export const horizon = new Horizon.Server(horizonUrl);

export function getHorizon(): Horizon.Server {
  return horizon;
}
