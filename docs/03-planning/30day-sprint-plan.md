# 30-Day Sprint — Development Plan

**Sprint goal:** Deliver a conversion-ready landing page, register **Sozu Wallet** as a Stellar Disbursement Platform (SDP) provider, and ship the NGO Dashboard MVP foundation (persistence + single on-chain payout) within a **$3,900** budget over **30 days**.

**Reference:** [Stellar Disbursement Platform](https://stellar.org/products-and-tools/disbursement-platform) · [Roadmap](../00-overview/roadmap.md) · [Production Disbursements Tasks](production-disbursements-tasks.md)

---

## Budget Allocation (Total: $3,900)

| Deliverable                              | Allocation | Rationale                                    |
| ---------------------------------------- | ---------- | -------------------------------------------- |
| **I. Sozu Wallet as SDP Provider**       | $800       | Fixed scope per sprint brief                 |
| **II.Conversion-Optimized Landing Page** | $2000      | API integration, receiver flow, docs         |
| **III. NGO Dashboard MVP — Foundation**  | $1100      | Phases A + B; enables demo with real payouts |
| **Total**                                | **$3,900** |                                              |

---

## Three Development Deliverables

### Deliverable 1 — Sozu Wallet as SDP Provider

**Budget: $800** · **Owner: Backend / Integrations**

**Objective:** Register Sozu Wallet as a **wallet provider** on the Stellar Disbursement Platform so that organizations using SDP can select “Sozu Wallet” as a receiver destination. Recipients receive disbursements into Sozu Wallet (USDC on Stellar).

**Scope (aligned with SDP wallet provider model):**

| Task                                 | Description                                                                                                                                                      | Outcome                                                                              |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **SDP wallet provider registration** | Integrate with SDP backend: register Sozu Wallet via provider APIs (e.g. create wallet provider with supported assets [USDC], auth domains, name “Sozu Wallet”). | Sozu appears in SDP’s “Get All Wallets” / wallet picker for disbursements            |
| **Receiver onboarding flow**         | SDP’s receiver flow: wallet registration/creation (e.g. SEP-24 or equivalent) so recipients can be invited (SMS/email) and receive funds to a Sozu Wallet.       | Senders can select Sozu Wallet; receivers get a clear path to create/use Sozu Wallet |
| **Documentation & handoff**          | One-pager for SDP operators: how to enable Sozu Wallet, supported assets (USDC on Stellar), regions (e.g. Argentina/LATAM), and contact.                         | SDP admins can add and configure Sozu Wallet in their instance                       |

**Out of scope for this sprint:** Full off-ramp (MoneyGram), KYC flows, and multi-region expansion beyond the documented pilot region.

**30-day outcome:** Sozu Wallet is a registered, selectable SDP provider; at least one SDP instance (e.g. sandbox or partner) can disburse to Sozu Wallet; docs ready for Stellar/partners.

---

### Deliverable 2 — Conversion-Optimized Landing Page

**Budget: $2,000** · **Owner: Front-end**

| Line item                                         | Amount | Outcome                                                                       |
| ------------------------------------------------- | ------ | ----------------------------------------------------------------------------- |
| Messaging strategy & value proposition refinement | $400   | Clear narrative: NGO disbursement, Sozu Wallet, SDP provider, Argentina/LATAM |
| Elegant mobile-first UX/UI design (Figma)         | $400   | High-fidelity landing (hero, benefits, SDP/Sozu, CTA)                         |
| Full-stack development (Next.js/Webflow)          | $900   | Deployed landing page with forms/CTAs                                         |
| Analytics, tracking & optimization setup          | $200   | Events, conversion goals, optional A/B hooks                                  |

**30-day outcome:** Live landing page that converts visitors (NGOs, partners) and positions Sozu Wallet as an SDP-enabled wallet.

---

### Deliverable 3 — NGO Dashboard MVP: Foundation + Single On-Chain Payout

**Budget: $950** · **Owner: Backend + Dashboard**

**Objective:** Replace in-memory state with persistence and execute **single** Stellar USDC payouts from the dashboard (Phases A + B of [production-disbursements-tasks.md](production-disbursements-tasks.md)). This demonstrates the dashboard as the control plane for disbursements that can later feed SDP and batch flows.

**Scope:**

| Phase                                        | Tasks                                                                                                                                                    | Outcome                                                                              |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Phase A — Persistence foundation**         | Postgres (or existing DB): persist payout records, audit log, idempotency keys. Replace in-memory `PayoutRecord[]` and audit store.                      | Payouts and audit survive restarts; idempotent single-payout API                     |
| **Phase B — Single on-chain Stellar payout** | For “to_stellar” payouts: sign and submit USDC payment via Horizon; store `stellarTxHash` and status; map Horizon errors to user-facing status/messages. | One-click payout from dashboard results in on-chain USDC transfer and stored tx hash |

**Explicitly in scope:**

- Persist payouts (id, userId, amount, type, destination, status, stellarTxHash, createdAt, idempotency key).
- Persist audit events (payouts, sensitive actions).
- Idempotency on single payout API (reject duplicate idempotency keys).
- Stellar: build/sign/submit USDC payment; update record with tx hash and success/failure.
- Error handling: insufficient balance, invalid destination, etc. → status + message.

**Deferred to post-sprint (no budget in this $950):**

- Phase C–F: batch data model, batch execution, batch UI, rate limits, per-batch limits, monitoring (future sprint).

**30-day outcome:** Dashboard is production-ready for **single** disbursements: data persisted, audit trail, and real on-chain USDC payouts with tx hash and status.

---

## 30-Day Sprint Timeline (High Level)

| Week  | Focus                                                                                                                                    | Deliverable |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **1** | Landing: messaging + Figma; Dashboard: Phase A (DB schema, migrate payouts/audit, idempotency); SDP: research provider API and auth flow | All three   |
| **2** | Landing: dev + deploy; Dashboard: Phase B (sign/submit, tx hash, errors); SDP: implement provider registration + receiver flow           | All three   |
| **3** | Landing: analytics + copy tweaks; Dashboard: testing, edge cases, runbooks; SDP: test with SDP sandbox, docs                             | All three   |
| **4** | Integration testing (dashboard payout → Sozu Wallet); bug fixes; sprint review and handoff                                               | All three   |

---

## Success Criteria (End of 30 Days)

| #   | Criterion                          | Measured by                                                                                                                    |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1   | **Landing page live**              | Deployed URL; messaging and CTAs aligned with Sozu + SDP story                                                                 |
| 2   | **Sozu Wallet is an SDP provider** | Sozu selectable in at least one SDP wallet list; receiver can receive a test disbursement to Sozu Wallet                       |
| 3   | **Single payout is on-chain**      | Dashboard single “to_stellar” payout creates a Stellar tx, stores tx hash, and shows success/failure with clear error messages |
| 4   | **Data and audit persist**         | Payout and audit records in DB; no reliance on in-memory state                                                                 |
| 5   | **Budget respected**               | Total spend ≤ $3,900 across the three deliverables                                                                             |

---

## Dependencies & Risks

| Risk                                             | Mitigation                                                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| SDP provider API or docs change                  | Lock scope to “register + one receiver path”; use SDP sandbox and Stellar dev relations if needed |
| DB migration delays Phase B                      | Phase A is week 1 priority; Phase B starts as soon as persistence is stable                       |
| Landing and dashboard compete for front-end time | Landing uses defined Figma + Webflow/Next split; dashboard work is backend-heavy (Phase A/B)      |

---

## Out of Scope (Future Sprints)

The following are **not** in the 30-day sprint; they are planned for production launch or later sprints:

| Item                                          | Description                                                                                                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Yield router contract**                     | Soroban contract that channels USDC to Defindex (and optionally Blend); per-depositor accounting; withdraw/redeem. Spec: [yield-router-contract-spec.md](../02-contracts/yield-router-contract-spec.md). |
| **NGO smart accounts with Defindex baked in** | NGO org wallet as smart account (C) with logic to target Defindex strategy; no need for users to sign each yield allocation.                                                               |
| **Strategic DeFi planner**                    | Default background logic (keeper or contract) that allocates/rebalances org idle USDC into the yield router by risk and policy; runs without per-action org signing.                       |

---

## Document Links

| Topic                                                | Document                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| Year 1 phasing, dev cycles                           | [roadmap.md](../00-overview/roadmap.md)                                                   |
| Batch model, Phases A–F detail                       | [production-disbursements-tasks.md](production-disbursements-tasks.md)     |
| NGO disbursement, MUJERES 2000                       | [ngo-disbursement-wallet-dev-plan.md](ngo-disbursement-wallet-dev-plan.md) |
| Yield router, NGO auto-yield, strategic DeFi planner | [yield-router-contract-spec.md](../02-contracts/yield-router-contract-spec.md)             |
| Current task list                                    | [todo.md](todo.md)                                                         |

---

## Document History

| Version | Date       | Change                                                                                                                                 |
| ------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1     | 2026-03-03 | Initial: 3 deliverables, $3,900 allocation, 30-day scope (Landing, SDP Sozu Wallet provider, NGO Dashboard Phases A+B).                |
| 0.2     | 2026-03-03 | Out of scope: yield router contract, NGO smart accounts with Defindex, strategic DeFi planner; doc link to yield-router-contract-spec. |
