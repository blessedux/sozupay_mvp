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

## Factory source and ABI

**Decision:** Prefer a **third-party factory** (e.g. [Crossmint stellar-smart-account](https://github.com/Crossmint/stellar-smart-account) or OpenZeppelin Stellar) if it provides a testnet deployment or a clear deploy path. Otherwise add and deploy **our own factory** in this repo (`contracts/smart_account_factory/`) so we control the ABI and testnet address.

**ABI our backend expects** ([src/lib/stellar/smart-account.ts](../../src/lib/stellar/smart-account.ts)):

- **Create method:** One argument `signer: Address` (the user’s G as Soroban Address). Default method name: `create_account`. Override with env `SMART_ACCOUNT_FACTORY_METHOD`.
- **Optional view (deterministic C address):** If the factory exposes a read-only function that returns the smart account address for a given signer before deployment, set its name in env `SMART_ACCOUNT_GET_ADDRESS_VIEW` (e.g. `get_address`). Signature: `(signer: Address) -> Address`. The backend calls this first to get the C address, then invokes the create method so we can store C after a successful tx.
- **Env:** `SMART_ACCOUNT_FACTORY_ID` (contract ID), `SOROBAN_RPC_URL`, `STELLAR_FUNDER_SECRET` (funder pays for deployment). Optional: `SMART_ACCOUNT_GET_ADDRESS_VIEW`, `SMART_ACCOUNT_FACTORY_METHOD`.

Any factory we adopt (third-party or own) must conform to this ABI so we do not need to change the backend.

## Implementation notes for C

- Use **Soroban** (RPC + SDK or CLI) to deploy/call contracts.
- Options: OpenZeppelin Stellar smart accounts, Crossmint stellar-smart-account (factory, deterministic addresses), or a custom contract.
- Store either:
  - Only the C address (smart account), or
  - Both signer public key (G) and smart account address (C); use C for display and funding.
- Funding: implement a path that sends XLM (or calls a fund method) to the C address when admin activates; exact steps depend on the chosen smart account contract.

## USDC for smart accounts (C)

For **classic G** accounts, the user adds a USDC trustline (one-time) after activation; the app offers an "Add USDC trustline" step and a sign-and-submit flow (see Profile and `/api/profile/wallet/trustline-tx`).

For **smart accounts (C)**, USDC is typically held via the contract (Soroban token interface), not a classic trustline. To make a C account "ready to receive USDC" after activation:

1. **Contract design:** The smart account contract should accept or wrap USDC (e.g. Soroban token transfers to the contract address, or a contract method that credits the account).
2. **Optional setup at activation:** When the backend funds the C account with XLM (in `POST /api/admin/activate-user`), you can add a follow-up Soroban invocation to run contract-specific USDC setup (e.g. initialize a token balance slot, or call a `setup_usdc` method) if your contract exposes it. Use env `SMART_ACCOUNT_USDC_SETUP_CONTRACT_ID` and optionally a method name; the funder key signs the invocation. If not set, no extra step is run; the account is still funded with XLM and ready for whatever the contract supports.
3. **Pre-funding:** Some flows pre-fund the C account with a small amount of USDC from the org treasury; that would be a separate backend step (e.g. after activation, call your payout or transfer logic to send USDC to the user’s C address).

## Env and troubleshooting

- **Funding failing for G accounts:** Set `STELLAR_FUNDER_SECRET` to the secret key of an account that holds XLM. On testnet, create that account and fund it via [Friendbot](https://laboratory.stellar.org/#explorer?resource=friendbot&endpoint=create).
- **Smart accounts (C):** Implemented: optional factory (`SMART_ACCOUNT_FACTORY_ID`, `SOROBAN_RPC_URL`, optional `SMART_ACCOUNT_GET_ADDRESS_VIEW`). On wallet register we create C when configured; on activate we fund C with XLM via Payment. USDC for C is contract-dependent (see above).
