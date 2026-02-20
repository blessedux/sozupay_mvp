# SozuPay: Technical Specification & Product Description

**Version:** 0.1  
**North Star:** [onepager.md](./onepager.md) — Seamless crypto-enhanced payments for e-commerce and in-person commerce, with a single dashboard as the merchant’s source of truth.

---

## 1. Product Summary

SozuPay is a **merchant-facing payment processor** that gives businesses:

- **One wallet, one dashboard** — USDC on Stellar as the base layer; full custody of keys; single place to track, move, and off-ramp funds.
- **Crypto-invisible UX** — Merchants and their customers get bank-like flows (pay by bank/card, receive in “dollars,” withdraw to any bank) while the engine runs on stablecoins and Stellar.
- **Yield by default** — Balances sit in a high-yield liquid vault; **Sozu earns only 10% of the yield** generated on that balance. No fees on transactions, tools, or core service.
- **Payment walls** — In-store (e.g. QR / kiosk) and online (e.g. Shopify, WooCommerce, custom) from the same account; e-commerce and physical stores from one product.
- **Automation** — Pay providers and employees from the same wallet and dashboard, with optional scheduling and rules.

The dashboard is the **single source of truth** for balance, transactions, vault, keys, recovery, payment walls, payouts, and bank accounts.

---

## 2. Technical Stack Overview

| Layer | Technology / Approach |
|-------|------------------------|
| **Chain & settlement** | Stellar (USDC, fast finality, low cost, transparent ledger) |
| **Stablecoin** | USDC on Stellar |
| **Custody** | Non-custodial: merchant holds keys; we never custody principal |
| **Wallet abstraction** | Abstract wallet creation (no “create wallet” step for user); key derivation/backup behind simple flows (e.g. email/link, optional 2FA) |
| **Auth** | Fast onboarding: magic link / email OTP or “preview” (pre-auth) flows; optional 2FA for sensitive actions (payouts, bank account, recovery) |
| **Dashboard** | Web app (recommend React/Next.js or similar); responsive for desktop and mobile |
| **Backend** | API layer for: auth, wallet proxy (no key handling server-side), transaction indexing, vault/yield, off-ramp, webhooks |
| **Data & indexing** | Stellar Horizon API + optional indexer/DB for history, tags, and reconciliation |
| **Payments on-ramp** | Open banking / card rails → conversion to USDC → credit to merchant Stellar wallet |
| **Off-ramp** | Partner provider(s) for USDC → fiat to designated bank account(s) |
| **Yield / vault** | DeFi or institutional yield product (e.g. lending) on Stellar or bridge; non-custodial where possible; liquid, no lockup |
| **Audit** | Stellar Expert / block explorer links for every relevant transaction |
| **Integrations** | Widget + REST/Webhook API for e-commerce; same API for payment walls and payouts |

---

## 3. User Flows

### 3.1 North Star: “Sign up fast, no crypto jargon”

- **Input:** Merchant signs up with email (or “preview” / pre-auth).
- **No explicit “create wallet”:** We create or map a Stellar account and key material in the background; user sees “Set up your SozuPay account.”
- **Output:** Account ready to receive USDC, view balance, and (after optional verification) add bank account and off-ramp.

### 3.2 Merchant onboarding (high level)

1. **Landing / sign-up**  
   - Enter email (and optionally name/business name).  
   - Auth: magic link or one-time code (or “preview” flow).  
   - No password required for first access (optional “secure login” later with 2FA).

2. **Wallet abstraction (behind the scenes)**  
   - System creates or associates a Stellar account (USDC).  
   - Key material: either (a) derived from a user-held secret (recovery phrase/encrypted backup) or (b) generated and handed off via a secure, one-time flow (e.g. encrypted backup + recovery method).  
   - User is never asked to “create a wallet” or “write down 12 words” unless they choose “advanced” recovery.  
   - Default: simple recovery (e.g. email-based restore or verified backup).

3. **Dashboard first experience**  
   - Redirect to dashboard.  
   - Show balance (0 USDC), empty transaction list, and short checklist: “Add a bank account,” “Create a payment wall,” “Link your store.”

4. **Optional verification**  
   - For off-ramp and/or higher limits: collect minimal business/bank details as required by off-ramp partner and compliance.  
   - Can be done later when merchant first adds a bank account.

### 3.3 Receiving payments (in-store and e-commerce)

- **In-store (payment wall)**  
  - Merchant creates a “wall” in dashboard (name, optional amount, optional reference).  
  - Deploy on device: QR code or kiosk URL.  
  - Customer scans/sees amount, pays (bank transfer or card via our on-ramp).  
  - Funds convert to USDC and credit merchant’s SozuPay wallet; transaction appears in dashboard and (optionally) in Stellar Expert.

- **E-commerce**  
  - Merchant installs widget or uses API on Shopify, WooCommerce, or custom site.  
  - Checkout: customer selects “Pay with bank/card” (SozuPay); widget pre-fills where possible.  
  - Same as above: on-ramp → USDC → merchant wallet; instant settlement in dashboard.

- **One balance**  
  - All payment walls and all e-commerce channels credit the **same** SozuPay (Stellar) wallet.  
  - Dashboard shows one balance and one transaction feed (with filters by source: wall, e-commerce, payout, etc.).

### 3.4 Dashboard daily use (single source of truth)

- **Balance**  
  - Single USDC balance; optional “available” vs “in vault” if vault is a separate contract/account.  
  - Display in local fiat (e.g. USD/CLP) using a clear rate source.

- **Transactions**  
  - List: date, amount, type (incoming payment, payout, yield, fee if any), source (which wall / which store), status.  
  - Each row links to Stellar Expert for that transaction.

- **Vault / yield**  
  - View balance in vault, current APY, accrued yield.  
  - “We earn 10% of your yield” clearly stated; principal 100% merchant’s.

- **Keys & custody**  
  - Short explanation: “You have full custody; we don’t hold your funds.”  
  - Access to: backup verification, recovery method (simple or advanced), and (if applicable) export public key / address for external audit.

- **Recovery**  
  - Simple path: email-based or verified backup restore.  
  - Optional advanced: recovery phrase or hardware key for power users.

- **Payment walls**  
  - Create / edit / archive walls.  
  - Per wall: name, default amount, optional reference, shareable link/QR.  
  - List of walls with last used and total volume (optional).

- **E-commerce**  
  - Connect stores (e.g. Shopify, WooCommerce), API keys, webhook URLs.  
  - Same balance and transaction list as walls.

- **Payouts (off-ramp and internal)**  
  - **To own bank:** Select linked bank account, amount, confirm. 2FA required for first-time or large payouts (configurable).  
  - **To other bank (e.g. provider/employee):** Same flow; admin chooses which bank account is “correct” for that recipient (per user or per payout).  
  - **To another Stellar address:** Optional “send USDC” for advanced users.  
  - All payout history in the same transaction list with “Payout” type and Stellar link.

- **Bank accounts**  
  - Add / edit / remove bank accounts.  
  - 2FA and secure method (e.g. re-auth, code) required to add or change bank details to avoid drain attacks.  
  - “Default” account for own withdrawals; others for payouts to providers/employees.

### 3.5 Automation: providers and employees

- **Concept**  
  - Merchant defines “recipients” (provider or employee): name, bank account, optional schedule or rules.  
  - From dashboard: one-off payouts or recurring/scheduled payouts from the same USDC wallet.  
  - Funds leave via same off-ramp; recipient gets fiat in their bank.

- **Flow**  
  - Add recipient (name + bank account); secure step (2FA) when adding/changing bank data.  
  - Create payout (manual or scheduled); confirm; debit USDC, off-ramp, credit recipient bank.  
  - Transaction appears in dashboard as “Payout – [Recipient]” with Stellar link.

### 3.6 Security and trust

- **Two-factor authentication**  
  - Optional for login; **required** for: adding/editing bank accounts, changing recovery method, large payouts (threshold configurable).  
  - TOTP (app) or SMS/email fallback; prefer TOTP for high-risk actions.

- **Secure updates**  
  - Sensitive data (bank details, recovery, 2FA) only change after re-auth or 2FA.  
  - Audit log (dashboard): “Bank account added,” “Recovery method changed,” “Payout to X.”

- **No drain by compromise of one channel**  
  - Attacker with only email cannot add a new bank account or change recovery without 2FA/re-auth.

---

## 4. What the Dashboard Does for the Merchant (Product View)

- **Single source of truth**  
  One balance (USDC), one transaction list, one vault view, one place for walls, stores, payouts, and bank accounts.

- **Full custody**  
  Keys and funds are the merchant’s; we never custody principal. Dashboard explains this and links to backup/recovery.

- **Transparency**  
  Every movement of funds can be audited on Stellar (Stellar Expert links). Balance and history are always visible.

- **Grow and scale**  
  Add more walls (more stores), more e-commerce channels, more recipients—all from the same wallet and dashboard.

- **Yield by default**  
  Idle balance earns yield in the vault; 10% of that yield goes to Sozu, 90% to the merchant; no lockup.

- **Off-ramp and banking**  
  Withdraw to own bank or to providers/employees’ banks; 2FA and secure flows so funds can’t be easily drained.

- **We win if you win**  
  No subscription, no per-transaction fee, no widget fee—only 10% of yield. Aligned with merchant success.

---

## 5. Functional Requirements (Checklist)

- [ ] **Auth:** Magic link or email OTP; optional “preview”/pre-auth; optional 2FA for login.  
- [ ] **Wallet abstraction:** No “create wallet” step; Stellar account + key handling behind simple onboarding.  
- [ ] **Simple recovery:** Email-based or one-click backup restore; optional advanced (phrase/hardware).  
- [ ] **Dashboard:** Balance (USDC + fiat), transactions with Stellar links, vault/yield view, keys & custody copy.  
- [ ] **Payment walls:** Create/edit walls; QR/link per wall; in-store use; same wallet.  
- [ ] **E-commerce:** Widget + API; Shopify/WooCommerce/custom; same wallet and transaction list.  
- [ ] **Off-ramp:** Withdraw to own or third-party bank; 2FA for add/edit bank and for large payouts.  
- [ ] **Bank accounts:** Add/edit/remove with 2FA; default for self; others for providers/employees.  
- [ ] **Provider/employee payouts:** Recipients with bank accounts; one-off and (optional) scheduled payouts from same wallet.  
- [ ] **Audit:** Stellar Expert (or equivalent) link on every relevant transaction.  
- [ ] **Security:** 2FA for sensitive actions; re-auth for sensitive data changes; no single-point drain.

---

## 6. Non-Functional and Compliance Notes

- **Performance:** Balance and recent transactions load in &lt;2s; payouts and off-ramp status clear and timely.  
- **Availability:** Dashboard and API target 99.9% uptime; Stellar settlement independent of our availability.  
- **Compliance:** Off-ramp and bank linkages follow partner and local rules; optional KYC/verification where needed.  
- **Privacy:** No KYC on core onboarding where legally possible; minimal data for off-ramp and fraud prevention.

---

## 7. Out of Scope for This Spec (Implementation Detail)

- Exact UI/UX mockups and component library.  
- Stellar key derivation and backup encryption schema (separate security spec).  
- Off-ramp partner APIs and fee structure (integrate via adapter).  
- Yield product (Aave or other) integration details (separate vault spec).  
- Exact 2FA provider (TOTP/SMS) and rate limits.

---

## 8. Document History

| Version | Date | Change |
|--------|------|--------|
| 0.1 | 2025-02-11 | Initial technical spec from onepager and product requirements. |

---

*This spec is the technical and product description for the SozuPay merchant dashboard and payment processor, aligned with [onepager.md](./onepager.md).*
