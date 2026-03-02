# Smart accounts (C) vs classic accounts (G)

## Address prefixes

- **G...** – Classic Stellar account (ed25519 keypair). Created with `Keypair.random()`; must be **funded** with a `createAccount` operation (minimum 1 XLM) before it exists on the ledger.
- **C...** – Contract/smart account (Soroban). Address of a deployed contract. Smart accounts implement custom auth (signers, policies, context rules) and are the target for “smart wallets.”

## Current flow (classic G)

1. User creates a keypair in the browser (G address), backs up the secret, registers with proof.
2. We store `stellar_public_key` (G...).
3. Admin activates → we set `allowed = true` and, if `STELLAR_FUNDER_SECRET` is set, we submit a **createAccount** transaction so the G account is funded and exists on the ledger.

Funding works only for **G** addresses. If the funder secret is missing or the funder has no XLM, activation will succeed but funding will fail (API returns 502 with details).

## Target flow (smart accounts C)

We want user-facing addresses to be **smart accounts (C)**:

1. User still creates a keypair (G) as the **signer** for the smart account.
2. Backend or a Soroban contract **creates a smart account** (e.g. via a factory or OpenZeppelin-style flow), binding the user’s G as a signer.
3. The **contract address (C...)** is stored as the user’s wallet address.
4. Funding a C account: transfer XLM (or other assets) to the contract or invoke a contract method, depending on the smart account implementation.

## Implementation notes for C

- Use **Soroban** (RPC + SDK or CLI) to deploy/call contracts.
- Options: OpenZeppelin Stellar smart accounts, Crossmint stellar-smart-account (factory, deterministic addresses), or a custom contract.
- Store either:
  - Only the C address (smart account), or
  - Both signer public key (G) and smart account address (C); use C for display and funding.
- Funding: implement a path that sends XLM (or calls a fund method) to the C address when admin activates; exact steps depend on the chosen smart account contract.

## Env and troubleshooting

- **Funding failing for G accounts:** Set `STELLAR_FUNDER_SECRET` to the secret key of an account that holds XLM. On testnet, create that account and fund it via [Friendbot](https://laboratory.stellar.org/#explorer?resource=friendbot&endpoint=create).
- **Smart accounts (C):** Not yet implemented; classic G flow is used until Soroban integration is in place.
