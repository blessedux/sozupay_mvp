# SozuPay Dashboard – Task List

Based on [docs/technical-spec.md](docs/technical-spec.md). Phases 1–10.

---

## Phase 1: Foundation

- [x] Initialize Next.js app (dashboard) and API (routes or separate service)
- [x] TypeScript, ESLint, Prettier, env config and .env.example
- [x] Stellar SDK / Horizon client in backend
- [x] README and runbooks (local dev, env vars)
- [x] Dashboard shell and health/status API

## Phase 2: Auth and onboarding

- [x] Magic link and/or email OTP auth
- [x] Optional preview/pre-auth flow
- [x] Optional 2FA for login (TOTP/SMS)
- [x] Post-auth redirect to dashboard
- [x] Onboarding checklist (add bank, create wall, link store)

## Phase 3: Wallet and recovery

- [x] Backend: create/associate Stellar account (USDC); key handling behind simple flow
- [x] Simple recovery (email-based or one-click backup)
- [x] Optional advanced recovery (phrase/hardware)
- [x] Dashboard: Keys & custody copy and recovery entry points
- [x] Optional: export public key/address for audit

## Phase 4: Dashboard core

- [x] Single USDC balance; optional available vs in-vault
- [x] Fiat display (e.g. USD/CLP) with clear rate source
- [x] Transaction list: date, amount, type, source, status
- [x] Stellar Expert link on every relevant transaction
- [x] Vault view: balance, APY, accrued yield; "10% Sozu" copy
- [x] Horizon + optional indexer/DB; balance/transactions <2s

## Phase 5: 2FA and security

- [x] 2FA required: add/edit bank, recovery change, large payouts (configurable)
- [x] Re-auth for sensitive data changes
- [x] Dashboard audit log (bank added, recovery changed, payout to X)

## Phase 6: Payment walls

- [x] Create / edit / archive payment walls (name, amount, reference)
- [x] Shareable link and QR per wall
- [x] List walls with last used and optional volume
- [x] On-ramp integration point (bank/card → USDC → wallet)
- [x] Wall-sourced transactions in feed with Stellar link

## Phase 7: E-commerce

- [x] Checkout widget and REST/Webhook API
- [x] Same wallet and transaction list as walls
- [x] Shopify / WooCommerce / custom integration docs and webhook contract
- [x] Transactions tagged by source (store)

## Phase 8: Bank and off-ramp

- [x] Add / edit / remove bank accounts (with 2FA)
- [x] Default account for self; others for providers/employees
- [x] Off-ramp: withdraw to own or third-party bank; 2FA for first-time/large
- [x] Payout history in transaction list with Stellar Expert link
- [x] Optional: send USDC to another Stellar address

## Phase 9: Providers and automation

- [x] Recipients (name, bank); 2FA when adding/changing bank
- [x] One-off payouts to recipients
- [x] Optional scheduled/recurring payouts
- [x] "Payout – [Recipient]" in transaction list with Stellar link

## Phase 10: NFRs and polish

- [x] Balance and recent transactions load <2s
- [x] Document 99.9% availability target; Stellar independence
- [x] Optional verification for off-ramp/higher limits
- [x] Responsive dashboard (desktop and mobile)
- [x] Basic accessibility and compliance notes
