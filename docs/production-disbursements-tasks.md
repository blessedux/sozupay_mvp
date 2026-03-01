# Missing Tasks: Production Dashboard & Simultaneous Disbursements

This document describes the **missing tasks** to reach a **production-ready** SozuPay dashboard **optimized for distributing simultaneous disbursements of credits (USDC) to specific wallets** (Stellar addresses and/or bank recipients).

---

## Current State (Summary)

- **Payouts**: Single payouts only (one destination per request). Records stored **in-memory** (`src/lib/payouts.ts`), so they are lost on restart.
- **To-Stellar**: API creates a payout record with `status: "pending"` but **no Stellar transaction is signed or submitted**; on-chain execution is not implemented.
- **To-Bank**: Record created; actual off-ramp is delegated to an adapter (integration point only).
- **No batch flow**: No API or UI for submitting multiple disbursements in one operation or for running many disbursements concurrently.

---

## Part 1: Production Readiness (General)

These tasks apply to the dashboard as a whole, not only to disbursements.

### 1.1 Persistence

| Task | Description |
|------|-------------|
| **Persist payout records** | Replace in-memory `PayoutRecord[]` with a database (e.g. Postgres via Prisma/Drizzle). Persist: id, userId, amount, type, destination (stellar/bank), status, stellarTxHash, createdAt, and any idempotency key. |
| **Persist audit log** | Audit events (payouts, bank added, recovery changed) should be stored in DB for compliance and debugging; today they are in-memory in `src/lib/audit.ts`. |
| **Persist payment walls** | Ensure walls (and any in-memory stores) are backed by DB so they survive restarts and scale across instances. |

### 1.2 Stellar Execution (To-Wallet Disbursements)

| Task | Description |
|------|-------------|
| **Sign and submit Stellar payments** | For `to_stellar` payouts: build/sign USDC payment transaction(s) using the merchant’s key (via your key-handling flow) and submit to Horizon. Update payout record with `stellarTxHash` and status on success/failure. |
| **Handle Stellar errors** | Map Horizon errors (insufficient balance, invalid destination, etc.) to payout status and user-facing messages. |
| **Idempotency for single payouts** | Accept an idempotency key per request so duplicate submissions don’t double-send; store and check in DB. |

### 1.3 Security & Operations

| Task | Description |
|------|-------------|
| **Rate limiting** | Add rate limits on payout and batch APIs to prevent abuse and protect Stellar submission rate. |
| **Webhook signature verification** | In production, verify webhook signatures for e-commerce/on-ramp events (see `api/webhooks/sozupay/route.ts`). |
| **Secrets and keys** | Ensure signing keys and API secrets are not in code; use env or a secrets manager. |
| **Monitoring and alerting** | Log payout and batch outcomes; metrics and alerts for failures, latency, and balance issues. |

### 1.4 Off-Ramp and Bank

| Task | Description |
|------|-------------|
| **Off-ramp adapter** | Implement or integrate the actual off-ramp provider so “to_bank” payouts execute and status is updated (e.g. pending → completed / failed). |
| **Payout status reconciliation** | Optional: periodic sync of payout status with provider and/or Stellar to keep DB in sync with reality. |

---

## Part 2: Simultaneous Disbursements to Specific Wallets

These tasks make the dashboard **optimized for distributing many disbursements at once** to specific wallets (Stellar addresses and/or bank recipients).

### 2.1 Data Model and API

| Task | Description |
|------|-------------|
| **Batch / disbursement job model** | Introduce a first-class “disbursement batch” or “job” entity: e.g. batchId, userId, status (draft \| submitted \| processing \| completed \| partial_failure), createdAt, totalAmount, totalRecipients, summary (e.g. succeeded/failed counts). |
| **Batch line items** | Each batch has many “lines”: recipient identifier (Stellar address or bank/recipient id), amount, optional memo/label, status (pending \| submitted \| completed \| failed), stellarTxHash or provider ref if applicable. |
| **Batch create API** | `POST /api/disbursements/batch`: accept an array of `{ destination, amount, label?, idempotencyKey? }` (destination = Stellar address or internal recipient id). Validate total balance and per-recipient limits; create batch and line records in DB; return batchId. |
| **Idempotency for batch create** | Support batch-level idempotency key so the same request doesn’t create two batches. |

### 2.2 Execution (Simultaneous / Concurrent)

| Task | Description |
|------|-------------|
| **Execution strategy** | Decide and implement how to run disbursements: e.g. (a) N concurrent Stellar payments per batch, (b) a queue (e.g. background job) that processes lines with bounded concurrency, or (c) Stellar bulk payment (e.g. one tx with multiple operations) if supported and within size limits. |
| **Concurrency control** | Limit concurrent Stellar submissions (per merchant or global) to avoid rate limits and sequence issues; use queue or semaphore. |
| **Per-line execution** | For each “to_stellar” line: build payment tx, sign, submit; update line status and optional stellarTxHash; on failure, mark line failed and optionally continue other lines. |
| **Balance checks** | Before and during execution, ensure wallet balance is sufficient for remaining lines; fail fast or pause batch if insufficient. |
| **2FA for batch** | Require 2FA (and optionally a total-amount threshold) when submitting a batch, similar to large single payouts. |

### 2.3 Dashboard UI

| Task | Description |
|------|-------------|
| **Batch creation UI** | Screen or modal to create a disbursement batch: upload CSV or form to add many recipients (Stellar address or select existing recipient), amount per recipient, optional memo; preview total and count; submit with 2FA if required. |
| **Batch list and detail** | List past batches (date, status, total amount, success/fail counts). Detail view: batch summary + table of lines with status, amount, destination, Stellar link (or bank ref). |
| **Progress and status** | For “processing” batches, show progress (e.g. X of Y completed) and per-line status; allow refresh or lightweight polling. |
| **Export / report** | Optional: export batch or line-level report (CSV) for reconciliation. |

### 2.4 Limits and Safety

| Task | Description |
|------|-------------|
| **Per-batch limits** | Configurable max recipients per batch and max total amount per batch to cap risk and UX complexity. |
| **Daily / periodic limits** | Optional: daily (or rolling) limit on total disbursed amount or count for compliance and risk. |
| **Duplicate detection** | Optional: detect duplicate (same destination + amount in short window) and warn or block. |
| **Allowlist / validation** | Optional: allowlist or validation for Stellar addresses (e.g. format, or pre-approved list) to reduce mis-sends. |

### 2.5 Reporting and Observability

| Task | Description |
|------|-------------|
| **Batch metrics** | Metrics: batches created, completed, partially failed; average time to complete; failure reasons. |
| **Alerts** | Alerts on high failure rate, repeated failures for same destination, or balance issues during batch run. |
| **Audit log** | Audit events for “Batch created”, “Batch submitted”, “Batch completed” (and optionally per-line) for compliance. |

---

## Achievable Plan (Brief Bullet List)

- **Phase A — Foundation**
  - Add Postgres (or chosen DB); persist payouts, audit log, and payment walls.
  - Add idempotency key to single payout API; store and reject duplicates.

- **Phase B — Single payout on-chain**
  - Implement Stellar sign + submit for one “to_stellar” payout; update record with tx hash and status.
  - Map Horizon errors to status and user-facing messages.

- **Phase C — Batch model (no execution yet)**
  - Add DB schema: disbursement_batch + disbursement_line (batchId, destination, amount, status, etc.).
  - `POST /api/disbursements/batch`: accept list of `{ destination, amount, label }`; validate balance/limits; create batch + lines; return batchId.
  - `GET /api/disbursements/batch/:id` and list endpoint; batch-level idempotency on create.

- **Phase D — Batch execution**
  - Background job or in-request loop: process batch lines with bounded concurrency (e.g. 5 at a time).
  - Per line: build/sign/submit Stellar payment; update line status and stellarTxHash; continue on line failure.
  - Pre-check balance for total batch; 2FA required to submit batch (and optional amount threshold).

- **Phase E — Batch UI**
  - Disbursements page: “New batch” (form or CSV) → add rows (destination, amount, label) → preview total → submit (with 2FA).
  - Batch list (date, status, total, success/fail counts); batch detail (lines + status + Stellar links); simple progress (e.g. X/Y completed).

- **Phase F — Hardening**
  - Rate limits on payout and batch APIs; webhook signature verification in production.
  - Per-batch limits (max recipients, max amount); optional duplicate detection and Stellar address validation.
  - Logging and basic metrics for payouts and batches; audit events for batch create/submit/complete.

---

## Part 3: Suggested Implementation Order

1. **Persistence** (payouts + audit) so all state survives restarts and is consistent across instances.
2. **Single Stellar payout execution** so one “to_stellar” payout actually submits and updates status.
3. **Batch data model and create API** (no execution yet) so you can create and list batches.
4. **Batch execution** (queue or concurrent worker) with concurrency limits and per-line status.
5. **Batch UI** (create, list, detail, progress).
6. **Limits, 2FA for batch, and observability.**

---

## Document History

| Version | Date | Change |
|--------|------|--------|
| 0.1 | 2025-02-23 | Initial: production gaps + simultaneous disbursement tasks. |
