import { getHorizon } from "./server";

// Circle USDC: testnet vs public have different issuers.
const USDC_ISSUER_TESTNET =
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const USDC_ISSUER_PUBLIC =
  "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4EZN";

export function getUsdcIssuer(): string {
  return process.env.STELLAR_NETWORK === "public"
    ? USDC_ISSUER_PUBLIC
    : USDC_ISSUER_TESTNET;
}

export async function getUsdcBalance(publicKey: string): Promise<string> {
  const server = getHorizon();
  try {
    const account = await server.accounts().accountId(publicKey).call();
    const usdc = account.balances.find(
      (b) =>
        b.asset_type !== "native" &&
        "asset_code" in b &&
        b.asset_code === "USDC" &&
        "asset_issuer" in b &&
        b.asset_issuer === getUsdcIssuer()
    );
    if (!usdc || !("balance" in usdc)) return "0";
    return usdc.balance;
  } catch {
    return "0";
  }
}
