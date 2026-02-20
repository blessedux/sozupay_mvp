/**
 * Stellar Horizon client – backend only.
 * No key handling in frontend; used for reading account/ledger data.
 */

import { Horizon } from "@stellar/stellar-sdk";

const horizonUrl =
  process.env.HORIZON_URL ?? "https://horizon-testnet.stellar.org";

export const horizon = new Horizon.Server(horizonUrl);

export function getHorizon(): Horizon.Server {
  return horizon;
}
