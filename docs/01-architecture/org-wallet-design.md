# Org Wallet & Admin Signing — Design

## Goal

- **Organization** has an **org wallet** that holds USDC and is the **source** of all payouts to recipients.
- **Super-admin** **authorizes** (and optionally **signs**) each payout; their identity is recorded for audit.

## Two Phases

### Phase 1 (current implementation): Org wallet signs

- **Org wallet**: One Stellar account (G...) per org (or one global) whose **secret key** is held by the backend (env: `ORG_DISBURSEMENT_SECRET`). This account holds USDC and has the USDC trustline.
- **Payout flow**: Super-admin triggers a payout in the UI → backend builds a payment **from org wallet to recipient** and **signs it with the org wallet key**. No personal admin key is on the Stellar transaction.
- **Audit**: We record that super-admin (user id) authorized the payout; the on-chain tx is signed only by the org wallet.

**Pros**: Simple, no multisig or Soroban. **Cons**: Admin does not literally “sign” the Stellar tx; it’s authorization in the app only.

### Phase 2 (future): Admin signs the transaction

Two options:

1. **Multisig (classic)**  
   - Org wallet is set up with 2 signers: org key (weight 1) + super-admin public key (weight 1), threshold 2.  
   - Backend builds the tx and signs with org key; frontend (or backend with unlocked admin key) adds the second signature.  
   - Both keys appear on the Stellar transaction.

2. **Smart account (Soroban)**  
   - Org has a **smart contract wallet** that holds USDC.  
   - Contract exposes something like `payout(recipient, amount)` and requires a valid signature from an **authorized signer** (super-admin’s public key).  
   - Backend builds an invocation tx; super-admin signs that invocation. Contract checks the signer and performs the transfer.  
   - Result: org’s funds are in the contract; admin’s key is on the tx as the authorizer.  
   - **Implementation:** [soroban-disbursement-contract.md](../02-contracts/soroban-disbursement-contract.md), [e2e-payout-test.md](../04-integrations/e2e-payout-test.md) §6 (NGO + Soroban), and payouts route when org has `soroban_contract_id`.

## Data model

- **organizations** (optional table): `id`, `name`, `stellar_disbursement_public_key` (display only; secret is in env or vault).
- **users**: `org_id` (FK to organization). Super-admins belong to an org; payouts use that org’s wallet.
- **Env**: `ORG_DISBURSEMENT_SECRET` = secret key of the org’s disbursement wallet (or one global org). Never expose to frontend.

## UI

- **Profile / Settings**: Show **org payout wallet address** (public key) and copy: “Fund this address with XLM and USDC to send payouts.”
- **Payout flow**: Super-admin clicks “Pay”; no need to “unlock” a personal wallet for Phase 1. Optional: require a confirmation step (e.g. re-enter password or 2FA) for audit.
