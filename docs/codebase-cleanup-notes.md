# Codebase cleanup notes

Summary of efficiency and leftover-code review (so we don’t re-add dead paths).

## Removed

- **`src/components/ui/demo.tsx`** – Unused UI component (grid + gradient background). Dashboard uses `elegant-dark-pattern` instead; nothing imported `demo`.
- **Privy `needsPayoutWalletSetup`** – Login no longer redirects using this. All post-login redirects (create-org, set-payout-wallet) are driven by **`/api/profile`** and **`OnboardingRedirect`** so there’s a single source of truth.
- **Duplicate audit in batch payouts** – For Stellar batch items we were logging both `payout_approved` (detailed) and `payout` (generic). We now log only `payout_approved` for Stellar; the generic `payout` is kept for non-Stellar items.

## Fixed

- **Profile wallet in unlock modal** – Recipients and Payouts pages were reading `payout_wallet_public_key` from profile; the API returns `org_payout_wallet_public_key` and `org_stellar_disbursement_public_key`. Both pages now use `org_payout_wallet_public_key ?? org_stellar_disbursement_public_key` so the “Payout wallet” line in the unlock modal shows the correct address (or the org’s disbursement address).
- **ARIA** – Recipients page expand button: `aria-expanded` set to boolean `isExpanded` for valid ARIA.

## Intentionally kept (still used)

- **Unlock flow** (`getUnlockedKey`, `unlock-wallet`, passphrase/secretKey) – Used when:
  - Org has a **Soroban** contract (signer required), or
  - No org/env disbursement key (super_admin signs with their own key).
- **`stellar_payout_public_key` / set-passphrase** – Still used for super_admins who don’t use an org wallet (e.g. set a passphrase-derived key or register a wallet and unlock with secret). OnboardingRedirect still sends to set-payout-wallet when `needsPayoutWalletSetup` (from profile) is true.
- **`getExpectedPayoutPublicKey`** – Used in unlock-wallet route to validate that the unlocked key matches the user’s payout wallet.
- **`wallet-resolve.ts`** – Used by dashboard/stats, transactions, wallet, vault, balance APIs for resolving which public key to use for balance/wallet display.

## Single source of truth for onboarding

- **`GET /api/profile`** – Defines `needsOrgCreation` and `needsPayoutWalletSetup`.
- **Login** – Always redirects to `/dashboard`; no redirect to onboarding from login.
- **`OnboardingRedirect`** (in dashboard layout) – Reads profile and redirects to `/onboarding/create-organization` or `/onboarding/set-payout-wallet` when needed.
