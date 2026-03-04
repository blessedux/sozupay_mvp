# Architecture: E2E Secure & Scalable Microcredit Disbursement

**Purpose:** Single reference for how the Sozu stack coordinates between the **NGO Dashboard (SozuPay)** and **individual wallets (Sozu Wallet)** to achieve end-to-end secure, auditable, and scalable disbursement of microcredits (USDC on Stellar).

**Scope:** Year 1 NGO disbursement (Argentina, USDC on Stellar). First NGO partner: MUJERES 2000. Aligned with [roadmap.md](../00-overview/roadmap.md), [ngo-disbursement-wallet-dev-plan.md](../03-planning/ngo-disbursement-wallet-dev-plan.md), [30day-sprint-plan.md](../03-planning/30day-sprint-plan.md), [org-wallet-design.md](./org-wallet-design.md), and [production-disbursements-tasks.md](../03-planning/production-disbursements-tasks.md).

---

## 1. High-Level System Context

```
                    ┌─────────────────────────────────────────────────────────────────┐
                    │                     EXTERNAL ACTORS                               │
                    └─────────────────────────────────────────────────────────────────┘
                         │                    │                    │
         ┌───────────────┘                    │                    └───────────────┐
         ▼                                    ▼                                    ▼
   ┌───────────┐                      ┌──────────────┐                    ┌─────────────┐
   │ NGO Staff │                      │ Emprendedora │                    │ SDP / Stellar│
   │ (Equipo)  │                      │ (Recipient)  │                    │  Ecosystem  │
   └─────┬─────┘                      └──────┬───────┘                    └──────┬──────┘
         │                                   │                                     │
         │ Dashboard                         │ Wallet + notifications              │ Horizon /
         │ (approve, batch,                  │ (receive USDC, pay,                 │ SDP API
         │  confirm payments)                 │  offramp)                           │
         ▼                                   ▼                                     ▼
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                           SOZU MICROCREDIT DISBURSEMENT STACK                                │
│  ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │   NGO Dashboard     │    │   Backend / API     │    │   Stellar + Soroban + SDP       │ │
│  │   (SozuPay)         │◄──►│   (Next.js, DB)     │◄──►│   (Horizon, org wallet, vault)  │ │
│  │   - Beneficiaries   │    │   - Persistence     │    │   - USDC transfers               │ │
│  │   - Batches         │    │   - Idempotency     │    │   - Disbursement tracking        │ │
│  │   - Audit           │    │   - Audit log       │    │   - (Optional) Soroban contract   │ │
│  └──────────┬──────────┘    └──────────┬──────────┘    └──────────────┬──────────────────┘ │
│             │                          │                               │                    │
│             │                          │                               │                    │
│             └──────────────────────────┼───────────────────────────────┘                    │
│                                        │                                                    │
│                                        ▼                                                    │
│  ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│  │   Sozu Wallet (per recipient)                                                        │   │
│  │   Non-custodial · USDC on Stellar · ARS display · Passkey/MPC · SDP receiver         │   │
│  └─────────────────────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Key idea:** The **dashboard** is the control plane (who gets what, when, audit). The **org wallet** is the single source of funds for payouts. **Individual wallets** are the destination; they can be reached via direct Stellar payment or (optionally) via SDP when Sozu Wallet is registered as an SDP provider.

---

## 2. Component Diagram — Where Each Piece Lives

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  NGO DASHBOARD (SozuPay) — Control Plane                                                      │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  • Beneficiary list & application workflow (approve/reject)                                   │
│  • Disbursement schedules & batch creation (CSV / form)                                       │
│  • Single payout & batch execution triggers (2FA for large/batch)                             │
│  • Payment management: confirm payment, mora, history, ranking, reports                      │
│  • Credit simulator (TNA, cuotas, mora), renewal, indicators, Salesforce sync                 │
│  • Org wallet display (public key): “Fund this address with XLM and USDC”                     │
└────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                             │
                                             │ HTTPS / API
                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  BACKEND (Next.js API + DB)                                                                   │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  • Persistence: payouts, disbursement_batch, disbursement_line, audit, beneficiaries          │
│  • Idempotency: single-payout and batch-create keys; reject duplicates                       │
│  • Stellar execution: build/sign USDC payment from org wallet → recipient Stellar address     │
│  • Optional: invoke Soroban disbursement contract (payout(recipient, amount)) when org has   │
│    soroban_contract_id; admin signs invocation                                               │
│  • Concurrency control: bounded parallel submissions to Horizon; queue or semaphore           │
│  • Env: ORG_DISBURSEMENT_SECRET (org wallet secret); never exposed to frontend                │
└────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
┌───────────────────────────┐  ┌───────────────────────────┐  ┌───────────────────────────┐
│  STELLAR HORIZON           │  │  SOROBAN (optional)       │  │  SDP (optional)            │
│  • Submit payment tx       │  │  • NGO vault / allocation │  │  • Sozu Wallet as provider │
│  • Query balance, history  │  │  • Disbursement/repayment │  │  • Receiver onboarding    │
│  • Map errors → status     │  │    tracking onchain       │  │  • Senders pick Sozu       │
└─────────────┬─────────────┘  │  • Trust score emission   │  └─────────────┬─────────────┘
              │                 └───────────────────────────┘                │
              │                                                              │
              ▼                                                              ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  STELLAR LEDGER                                                                               │
│  • Org wallet (G...): holds USDC; signs payout tx (Phase 1) or is 1 of 2 multisig (Phase 2)   │
│  • Recipient accounts (G...): each emprendedora’s Sozu Wallet; receive USDC                   │
│  • Optional: Soroban contract (C...) holds USDC; payout() requires authorized signer          │
└────────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                             │
                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│  SOZU WALLET (per recipient) — Destination                                                     │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│  • Non-custodial; USDC on Stellar; ARS default display                                         │
│  • Passkey/MPC; keys never leave device/MPC enclave                                            │
│  • Receive disbursements (from dashboard-initiated Stellar payment or via SDP)                │
│  • Transaction history; offramp (MoneyGram ARS cash-out)                                       │
│  • Credit state & calendar (via dashboard/backend data or future sync)                         │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. End-to-End Disbursement Flow (Single & Batch)

### 3.1 Single Payout (MVP — 30-day scope)

```
  NGO Staff          Dashboard (UI)         Backend API              DB              Horizon        Sozu Wallet
      │                    │                     │                   │                 │                │
      │  Click "Pay"       │                     │                   │                 │                │
      │  (recipient,       │                     │                   │                 │                │
      │   amount)          │                     │                   │                 │                │
      │──────────────────►│                     │                   │                 │                │
      │                    │  POST /payout       │                   │                 │                │
      │                    │  idempotencyKey     │                   │                 │                │
      │                    │───────────────────►│                   │                 │                │
      │                    │                    │  Check idempotency │                 │                │
      │                    │                    │──────────────────►│                 │                │
      │                    │                    │  Reject if dup    │                 │                │
      │                    │                    │◄──────────────────│                 │                │
      │                    │                    │  Create payout row │                 │                │
      │                    │                    │  (pending)         │                 │                │
      │                    │                    │──────────────────►│                 │                │
      │                    │                    │  Build Stellar tx   │                 │                │
      │                    │                    │  (org wallet →     │                 │                │
      │                    │                    │   recipient G...)  │                 │                │
      │                    │                    │  Sign (ORG_SECRET) │                 │                │
      │                    │                    │  Submit             │                 │                │
      │                    │                    │────────────────────────────────────►│                │
      │                    │                    │                    │    Tx on-chain  │                │
      │                    │                    │                    │                 │──── USDC ─────►│
      │                    │                    │  txHash + status    │                 │                │
      │                    │                    │◄────────────────────────────────────│                │
      │                    │                    │  Update payout row  │                 │                │
      │                    │                    │  Audit log          │                 │                │
      │                    │                    │──────────────────►│                 │                │
      │                    │  200 + txHash      │                   │                 │                │
      │                    │◄───────────────────│                   │                 │                │
      │  Success / failure │                    │                   │                 │                │
      │◄──────────────────│                    │                   │                 │                │
```

### 3.2 Batch Disbursement (Production)

```
  NGO Staff          Dashboard              Backend                   DB              Horizon        Wallets
      │                    │                     │                   │                 │                │
      │  Create batch      │                     │                   │                 │                │
      │  (CSV / form:      │                     │                   │                 │                │
      │   list of          │                     │                   │                 │                │
      │   destination,     │                     │                   │                 │                │
      │   amount)          │                     │                   │                 │                │
      │──────────────────►│  POST /batch        │                   │                 │                │
      │                    │  idempotencyKey     │                   │                 │                │
      │                    │───────────────────►│  Validate balance │                 │                │
      │                    │                    │  Create batch +    │                 │                │
      │                    │                    │  lines (pending)   │                 │                │
      │                    │                    │──────────────────►│                 │                │
      │                    │  201 batchId       │                   │                 │                │
      │                    │◄───────────────────│                   │                 │                │
      │  Submit batch      │                     │                   │                 │                │
      │  (2FA if required) │                     │                   │                 │                │
      │──────────────────►│  POST batch/execute │                   │                 │                │
      │                    │───────────────────►│  Queue / N concurrent              │                │
      │                    │                    │  For each line:   │                 │                │
      │                    │                    │    build tx → sign → submit        │                │
      │                    │                    │────────────────────────────────────►│  USDC each ──►│
      │                    │                    │  Update line (txHash / failed)     │                 │
      │                    │                    │  Batch status when all done        │                 │
      │                    │  Progress polling  │                   │                 │                │
      │                    │◄───────────────────│                   │                 │                │
      │  List + detail     │  GET batch/:id    │                   │                 │                │
      │  (success/fail)     │◄───────────────────│                   │                 │                │
```

---

## 4. Data Flow: From Application to On-Chain Payout

```
  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
  │  Emprendedora    │     │  Beneficiary     │     │  Schedule /     │     │  Disbursement   │
  │  Application    │────►│  Record (DB)    │────►│  Batch (DB)     │────►│  Line (DB)      │
  │  (Form / PDF)   │     │  + Stellar addr │     │  + lines        │     │  destination,   │
  └─────────────────┘     └────────┬────────┘     └────────┬────────┘     │  amount, status │
                                   │                       │              └────────┬────────┘
                                   │                       │                       │
                                   │                       │  Execute (bounded     │
                                   │                       │  concurrency)         │
                                   │                       ▼                       ▼
                                   │              ┌────────────────────────────────────────────┐
                                   │              │  Backend: build payment(org_wallet → dest)  │
                                   │              │  Sign with ORG_DISBURSEMENT_SECRET         │
                                   │              │  Submit to Horizon                         │
                                   │              └────────────────────────┬───────────────────┘
                                   │                                       │
                                   │                                       ▼
                                   │              ┌────────────────────────────────────────────┐
                                   │              │  Stellar: USDC transfer                     │
                                   │              │  Org wallet (G...) → Recipient (G...)       │
                                   │              │  txHash stored on disbursement_line         │
                                   │              └────────────────────────────────────────────┘
                                   │
                                   └──────────────► Sozu Wallet (recipient G...) holds USDC
                                                    Balance + history in wallet UI
```

---

## 5. Security Boundaries

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│  TRUST BOUNDARIES                                                                            │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│  [ NGO Staff ]  ──►  Dashboard (auth, 2FA for payout/batch)  ──►  Audit: who triggered what   │
│       │                                                                                      │
│       │  No direct access to signing key                                                      │
│       ▼                                                                                      │
│  [ Backend ]   ──►  Holds ORG_DISBURSEMENT_SECRET only in env / secrets manager              │
│       │              Never logged or sent to frontend                                        │
│       │              Phase 2: optional multisig or Soroban — admin key signs tx               │
│       ▼                                                                                      │
│  [ Stellar ]   ──►  On-chain: only org wallet (or contract) signs; recipient receives USDC   │
│       │              Immutable txHash for every payout                                       │
│       ▼                                                                                      │
│  [ Sozu Wallet ]  ──►  Non-custodial; recipient controls keys (passkey/MPC)                   │
│                        No Sozu custody of recipient funds                                     │
│                                                                                              │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  IDEMPOTENCY   Single and batch create accept keys; duplicate requests rejected → no double-send
│  AUDIT         All payout/batch events persisted (DB); link to Stellar Explorer by txHash    │
│  RATE LIMITS   Concurrency cap on Horizon submissions; optional daily/per-batch limits       │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Org Wallet & Signing (Phases)

```
  Phase 1 (current):  Org wallet signs
  ─────────────────────────────────────
  • One Stellar account (G...) per org; secret in env (ORG_DISBURSEMENT_SECRET).
  • Backend builds payment(org → recipient), signs with org key, submits.
  • Audit: super-admin (user id) authorized in app; Stellar tx signed only by org wallet.

  Phase 2 (future):  Admin signs the transaction
  ─────────────────────────────────────────────
  • Option A — Multisig: org key (1) + super-admin key (1), threshold 2; both on tx.
  • Option B — Soroban: smart contract holds USDC; payout(caller, recipient, amount);
    require_auth(caller); caller in signers list; backend builds invoke, admin signs.
```

See [org-wallet-design.md](./org-wallet-design.md) and [soroban-disbursement-contract.md](../02-contracts/soroban-disbursement-contract.md).

---

## 6b. NGO Smart Accounts & Yield (Production)

- **NGO org deposits** use **smart accounts (C)** with logic baked in to target Defindex (and optionally Blend). Idle USDC is routed via a **yield router contract**; a default **strategic DeFi planner** runs in the background—**no per-action user signing** for the yield leg.
- **Yield router (C):** Channels org (and optionally user) USDC to Defindex strategies; tracks per-depositor principal; redeems on withdraw. See [yield-router-contract-spec.md](../02-contracts/yield-router-contract-spec.md).
- **Strategic DeFi planner:** Allocates/rebalances by policy and risk; runs as keeper or authorized contract so NGOs earn yield by default without extra UX.

---

## 7. Scalability & Production Readiness

| Concern             | Approach                                                                                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Many recipients** | Batch model: create batch with N lines; execute with bounded concurrency (e.g. N parallel Horizon submissions); queue or semaphore to avoid rate limits and sequence issues. |
| **Persistence**     | All payout records, batch/line, audit in DB (e.g. Postgres); no in-memory state for critical data.                                                                           |
| **Idempotency**     | Single-payout and batch-create APIs accept idempotency keys; store and reject duplicates.                                                                                    |
| **Balance**         | Check org wallet balance before/during batch; fail fast or pause if insufficient.                                                                                            |
| **Limits**          | Per-batch max recipients and max amount; optional daily/rolling caps.                                                                                                        |
| **Observability**   | Log outcomes; metrics (batch completed, partial failure, latency); alerts on high failure rate or balance issues.                                                            |
| **SDP path**        | When Sozu Wallet is registered as SDP provider, senders can select Sozu; recipients receive via same Stellar address (wallet creation/onboarding via SDP receiver flow).     |

---

## 8. How Dashboard and Wallets Coordinate — Summary

1. **Dashboard** defines who gets paid (beneficiaries, schedules, batches) and triggers payouts; it never holds recipient keys.
2. **Backend** holds the org wallet secret (or coordinates multisig/Soroban); builds and submits Stellar payments to **recipient Stellar addresses**.
3. **Recipient address** is the same as the **Sozu Wallet** account for that beneficiary; disbursement lands in their non-custodial wallet.
4. **Sozu Wallet** shows balance (USDC/ARS), history, and (with offramp) cash-out; optional SDP path for third-party senders to send to Sozu.
5. **Soroban** (optional) adds on-chain vault, disbursement/repayment tracking, and trust score; Defindex/Blend add yield on idle USDC.
6. **Yield router & NGO auto-yield:** Org smart accounts (C) route idle USDC to Defindex via the yield router; a strategic DeFi planner works in the background so NGOs earn yield without signing each allocation. See [yield-router-contract-spec.md](../02-contracts/yield-router-contract-spec.md).
7. **E2E**: Application → Beneficiary (with Stellar address) → Batch/line → Backend signs and submits → Horizon → USDC in Sozu Wallet → Audit and txHash stored.

---

## 9. Document References

| Topic                                                              | Document                                                                     |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 30-day sprint (Landing, SDP provider, Dashboard MVP single payout) | [30day-sprint-plan.md](../03-planning/30day-sprint-plan.md)     |
| NGO disbursement full plan, MUJERES 2000, milestones               | [ngo-disbursement-wallet-dev-plan.md](../03-planning/ngo-disbursement-wallet-dev-plan.md) |
| Roadmap (Year 1/2/4), dev cycles                                   | [roadmap.md](../00-overview/roadmap.md)                                                   |
| Current tasks, Phase 1–10 + NGO focus                              | [todo.md](../03-planning/todo.md)                                                         |
| Org wallet and admin signing (Phase 1 & 2)                         | [org-wallet-design.md](./org-wallet-design.md)                               |
| Batch model, persistence, execution (Phases A–F)                   | [production-disbursements-tasks.md](../03-planning/production-disbursements-tasks.md)     |
| Soroban disbursement contract (Phase 2)                            | [soroban-disbursement-contract.md](../02-contracts/soroban-disbursement-contract.md)       |
| Yield router, NGO auto-yield, strategic DeFi planner               | [yield-router-contract-spec.md](../02-contracts/yield-router-contract-spec.md)             |
| Product one-pager (e-commerce + value prop)                        | [onepager.md](../00-overview/onepager.md)                                                 |

---

## Document History

| Version | Date       | Change                                                                                        |
| ------- | ---------- | --------------------------------------------------------------------------------------------- |
| 0.1     | 2026-03-03 | Initial: system context, components, E2E flows, data flow, security, scalability, references. |
| 0.2     | 2026-03-03 | §6b NGO smart accounts & yield; §8 yield router & strategic DeFi planner; doc ref yield-router-contract-spec. |
