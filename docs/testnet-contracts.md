# Testnet contract addresses

Single place to record Soroban contract IDs and token addresses used on **testnet**. Update this doc after each deploy or when external addresses are confirmed.

## USDC token (testnet)

Used by the disbursement wallet and (when implemented) vault/Blend integration.

- **Classic issuer (Horizon):** `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` (see [src/lib/stellar/balance.ts](../src/lib/stellar/balance.ts)).
- **Soroban token contract (Stellar Asset Contract):** Resolve via Stellar Asset Contract for USDC testnet (issuer above). Use Soroban CLI or [Stellar docs](https://developers.stellar.org/docs/smart-contracts/guides/asset-contract) to get the contract ID.
  - Example CLI: `soroban contract asset deploy --asset "USDC:GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" --source <key> --network testnet` (if deploying a custom SAC), or use the canonical testnet USDC contract address from Circle/Stellar documentation.
  - **Record here after resolution:** `___________________________`

## Disbursement wallet

One deployment per org (or one shared contract). After deploy, run `initialize(token_address, [signer_address])` and fund the contract with USDC.

| Org / purpose | Contract ID (C...) | Initialized | Notes |
|---------------|--------------------|-------------|--------|
| (example)     | —                  | —           | Set in org `soroban_contract_id` in DB |

## Smart account factory

Used by [src/lib/stellar/smart-account.ts](../src/lib/stellar/smart-account.ts) when `SMART_ACCOUNT_FACTORY_ID` is set. Creates smart accounts (C) bound to a user signer (G).

- **Contract ID:** `___________________________`
- **Method:** `create_account` (or set `SMART_ACCOUNT_FACTORY_METHOD` in env).
- **Optional view (deterministic address):** Set `SMART_ACCOUNT_GET_ADDRESS_VIEW` in env if the factory exposes e.g. `get_address(signer)`.

**Factory source:** Prefer third-party (Crossmint/OpenZeppelin); otherwise we add our own in this repo. ABI and env are documented in [smart-accounts.md](./smart-accounts.md#factory-source-and-abi).

## Blend (external)

We do **not** deploy Blend; we integrate with their testnet deployments.

- **USDC pool / supply entrypoint:** TBD – from [Blend docs](https://docs.blend.capital/) or their repo.
- **Withdraw entrypoint:** TBD.
- **First version:** Backend-only integration (no vault contract). See [Blend integration](#blend-integration) section in this repo.

## Defindex (external)

We integrate with Defindex for yield strategies; no deployment by us.

- **Testnet strategy / contract addresses:** TBD when integrating.

---

## Blend integration

Blend is a non-custodial lending protocol on Stellar (Soroban). We use it for auto-routing and balancing of org USDC (supply USDC, earn yield). Blend’s contracts are deployed by Blend; we only integrate.

**Required for integration:**

- **Testnet contract addresses:** USDC pool (or market), supply entrypoint, withdraw entrypoint. Obtain from [Blend documentation](https://docs.blend.capital/) or their GitHub.
- **Entrypoints:** Typically `deposit` / `supply` and `withdraw` (exact names from Blend ABI). Receipt tokens (e.g. bUSDC) may be returned for supplied balance.
- **First version:** Backend-only. Backend (with org or super-admin key) calls Blend’s supply/withdraw directly; [src/app/api/vault/route.ts](../src/app/api/vault/route.ts) and the vault dashboard are wired to read balances and (when implemented) trigger supply/withdraw. No SozuPay-deployed vault contract in v1.
- **Optional later:** A dedicated vault contract that holds org USDC and exposes “deposit into Blend”, “withdraw”, “rebalance” for on-chain transparency and multi-sig.
