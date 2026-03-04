# Phase: Privy Auth + Stellar Wallet + User/Admin + USDC Audit + Persona KYC

Feature branch: **`feat/privy-stellar-kyc`**

This doc defines the first development phase: dashboard login via Privy, abstracted Stellar wallets per user, super-admin wallet activation, user/admin management, real USDC on-chain tracking with audit, and Persona KYC with super-admin management.

---

## Goals

1. **Login:** Privy (email, optional passkey, simple recovery) — no connect-wallet; each user has an abstracted dashboard wallet.
2. **Stellar:** Stellar SDK + Horizon for receiving USDC; one Stellar account per user (created and managed server-side).
3. **Activation:** Super admin can “Activate wallet” (send XLM) so the user’s account can hold USDC trustline.
4. **Users & admins:** Manage users and admin levels (e.g. super_admin, admin, user) in the dashboard.
5. **USDC tracking:** Real on-chain USDC: disbursement amounts, payback cycles, repayment history, available credit; simple audit tools.
6. **KYC:** Persona for verification (third-party); super admins view/manage KYC status in the dashboard (liability stays with Persona).

---

## Architecture (high level)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Dashboard (Next.js)                                                     │
│  • Privy: login (email, passkey, recovery)                               │
│  • Per user: one Stellar public key (abstracted; key server-side)       │
│  • Super admin: activate wallet (send XLM), manage users, view KYC      │
└─────────────────────────────────────────────────────────────────────────┘
         │
         ├── Privy (auth)
         ├── Horizon API (balance, transactions, USDC trustline)
         ├── Persona (KYC; super admin views status)
         └── DB: users, admin_role, stellar_public_key, activation_status, KYC refs
```

---

## Implementation order

### 1. Privy: dashboard login and account recovery

- Add [Privy](https://docs.privy.io) React SDK; configure login methods: **email** (primary), **passkey** (optional).
- Replace current mock/magic-link auth with Privy. After login, backend identifies user by Privy `userId` (or email); create or load app user and session.
- Ensure simple account recovery via Privy (email OTP / passkey recovery as per Privy docs).
- **Outcome:** User signs in with email (and optionally passkey); no connect-wallet; session tied to Privy user.

### 2. Stellar SDK + Horizon: abstracted wallet per user

- **Backend:** When a new user is created (first Privy login), generate a Stellar keypair; store `user_id → stellar_public_key` and encrypted secret (or key derivation) in DB. Do not expose secret to frontend.
- **Horizon:** Use existing `lib/stellar` for balance and history. Ensure USDC trustline (issuer) is correct for testnet/mainnet.
- **Dashboard:** Show user’s Stellar address (public key) and “Wallet not activated” until funded with XLM; after activation, show USDC balance.
- **Outcome:** Each logged-in user has exactly one Stellar account; keys server-side; dashboard shows address and status.

### 3. Super-admin: activate wallet (send XLM)

- **Role:** Introduce `admin_level` (e.g. `super_admin` | `admin` | `user`). Only `super_admin` can activate wallets.
- **UI:** Super-admin page: list users with Stellar address and “Activate wallet” button. On click: backend sends minimum XLM (e.g. for account + trustline) from a **funding account** (env: `STELLAR_FUNDING_SECRET_KEY` or similar) to the user’s public key.
- **State:** Persist `wallet_activated_at` (or similar) so we don’t double-fund; show “Activated” in dashboard.
- **Outcome:** One-click activation so any user’s wallet can receive USDC.

### 4. User and admin management

- **Data model:** Users table: `id`, `privy_user_id`, `email`, `admin_level`, `stellar_public_key`, `wallet_activated_at`, timestamps. Optional: `persona_inquiry_id` for KYC.
- **Dashboard UI:** Super admin (and optionally admin) can list users, filter, and set `admin_level`. Regular users do not see other users.
- **Outcome:** Clear roles and centralized user list for admins.

### 5. USDC on-chain tracking and audit

- **Data:** Use Horizon to fetch USDC balance and payment history per user (by Stellar public key). Optionally persist disbursement/repayment events in DB for fast audit (with on-chain as source of truth).
- **Dashboard:** Per-user view: disbursement amounts (from history or DB), payback cycles, repayment history, and **available credit** (e.g. max credit minus current balance or minus sum of disbursements not yet repaid, depending on product rules).
- **Audit tools:** Simple list/export: per user — disbursements, repayments, current balance, available credit; filters by date, user.
- **Outcome:** Real USDC tracking and audit for disbursements, repayments, and credit.

### 6. Persona KYC and super-admin KYC management

- **Integration:** [Persona](https://docs.withpersona.com) for identity verification. Frontend: start Persona flow (link or embed); on completion, Persona webhook or client callback sends inquiry/id; backend stores `persona_inquiry_id` (and optionally status) for the user.
- **Liability:** KYC is performed and held by Persona (third party); we only store reference and status. Super admins do not perform KYC themselves; they manage/view KYC data.
- **Dashboard:** Super admin (and optionally admin) can see KYC status per user (e.g. “Pending”, “Approved”, “Declined”) and link to Persona dashboard if needed. No PII storage beyond what’s required for linking (e.g. inquiry id).
- **Outcome:** KYC via Persona; super admins manage and monitor KYC from the dashboard.

---

## Tech choices

| Area | Choice |
|------|--------|
| Auth | Privy (email, optional passkey, recovery) |
| Wallet | One Stellar keypair per user **client-side**; user registers public key + proof; we store only public key (see [self-custodial-auth-design.md](../01-architecture/self-custodial-auth-design.md)) |
| Activation | Super admin sends XLM from funding account to user’s public key |
| Users/roles | DB: `stellar_public_key`, `allowed`, `admin_level`, `org_id`; no secret keys; super admin allowlists and grants admin |
| USDC | Stellar USDC trustline; Horizon + optional DB cache for audit |
| KYC | Persona; super admin views status and inquiry refs |

---

## Env and secrets

- **Privy:** `PRIVY_APP_ID`, `PRIVY_APP_SECRET` (from dashboard). For the client (login UI), also set `NEXT_PUBLIC_PRIVY_APP_ID` to the same value as `PRIVY_APP_ID`. For server token verification, set `PRIVY_VERIFICATION_KEY` (Dashboard > App settings > Verification key; not the app secret).
- (Self-custodial: no funding key; user activates via Friendbot.)
- Persona API keys and webhook secret (when implementing KYC)
- DB (e.g. Postgres) for users, roles, Stellar keys, activation, KYC refs

---

## Docs and references

- [self-custodial-auth-design.md](../01-architecture/self-custodial-auth-design.md) — no key custody; allowlist; super admin; org space
- [Privy – React quickstart](https://docs.privy.io/basics/react/quickstart)
- [Privy – Email & passkey](https://docs.privy.io/guide/react/configuration/login-methods)
- [Stellar Horizon API](https://developers.stellar.org/api/horizon)
- [Persona](https://docs.withpersona.com) (when implementing)

---

## Implementation status

| Step | Status | Notes |
|------|--------|--------|
| 1. Privy login | Done | `PrivyProviderWrapper`, login page (email OTP + optional passkey), `POST /api/auth/privy` (verify access token, set session), Sign out clears Privy + session. Env: `PRIVY_APP_ID`, `PRIVY_APP_SECRET`; `NEXT_PUBLIC_PRIVY_APP_ID` (same as app id, for client); `PRIVY_VERIFICATION_KEY` (from dashboard, for server verification). |
| 2. Stellar wallet per user | Pending | DB + keypair per user; Horizon for balance. |
| 3. Super-admin activate wallet | Pending | |
| 4. User & admin management | Pending | |
| 5. USDC tracking & audit | Pending | |
| 6. Persona KYC | Pending | |

---

## Document history

| Version | Date | Change |
|--------|------|--------|
| 0.1 | 2026-03-01 | Initial: Privy, Stellar abstracted wallet, super-admin activation, user/admin, USDC audit, Persona KYC. |
| 0.2 | 2026-03-01 | Privy implementation: provider, login (email + passkey), /api/auth/privy, logout. |
