# Yield Router Contract — Specification

**Purpose:** Define the Soroban yield router and the **NGO smart-account auto-yield** model: org deposits use smart accounts with logic baked in to target Defindex (and optionally Blend) via a default **strategic DeFi planner** working in the background—**no per-action user signing** required for the yield leg.

**Scope:** Production launch requirement (Blend + Defindex integration). Aligned with [architecture-microcredit-disbursement.md](../01-architecture/architecture-microcredit-disbursement.md), [roadmap.md](../00-overview/roadmap.md), [ngo-disbursement-wallet-dev-plan.md](../03-planning/ngo-disbursement-wallet-dev-plan.md), and [testnet-contracts.md](./testnet-contracts.md).

---

## 1. Overview

| Component | Role |
|-----------|------|
| **Yield router contract (C)** | Channels USDC to Defindex strategies (and optionally Blend); tracks allocations; redeems on withdraw. |
| **NGO org smart account (C)** | Holds USDC for disbursements **and** has baked-in logic: idle balance is automatically routed to the yield router / Defindex via a **strategic DeFi planner**—no user signing for yield allocation. |
| **Strategic DeFi planner** | Default on-chain or backend-coordinated logic that allocates/rebalances org (and optionally user) funds across approved strategies by risk and policy; runs in the background. |

**Key design choice (NGO):** NGO organization deposits are **smart accounts** with the yield logic **baked in**. The org does not sign each "move to yield" action; a default strategic planner works in the background so idle USDC earns yield without extra UX friction.

---

## 2. NGO Smart Account — Auto-Yield (No User Signing)

### 2.1 Model

- **NGO org wallet** is a **smart account (C)** that:
  1. Holds USDC for disbursements (payouts to beneficiaries).
  2. Exposes **disbursement** entrypoints (e.g. `payout(caller, recipient, amount)`) as in [soroban-disbursement-contract.md](./soroban-disbursement-contract.md).
  3. Has **baked-in yield logic**: when idle USDC exceeds a configured threshold (or on a periodic/event-driven basis), the contract—or an authorized **strategic DeFi planner**—moves excess USDC into the yield router / Defindex strategy **without requiring the org to sign** each allocation.

### 2.2 How "no user signing" works

- **Option A — Planner as authorized actor:** The smart account stores a list of **authorized signers**. One of them is the **strategic DeFi planner** (e.g. a dedicated Soroban contract or a backend-held key used only to invoke "allocate to yield"). The planner is authorized to call an entrypoint such as `allocate_idle_to_yield(env, amount)` or `sweep_to_router(env)`. The org signs once (at setup) to add the planner; thereafter the planner runs in the background.
- **Option B — Time- or threshold-based internal call:** The org smart account contract has an entrypoint that anyone (or a keeper) can call, e.g. `rebalance_idle(env)`, which moves balance above threshold from the contract to the yield router. The contract's own logic moves the funds; no org key signature on that tx. (Keeper or backend triggers the tx; contract logic does the transfer.)
- **Option C — Yield router pulls from org:** The yield router contract is authorized (e.g. via token allowance or a dedicated `sweep_from(org_smart_account, amount)` that the org pre-authorizes) to pull idle USDC from the org smart account when the planner decides to allocate. Again, no per-allocation org signature.

**Recommendation:** Option A or B for clarity: either the planner is an authorized signer that calls "allocate to yield," or the org contract exposes a rebalance entrypoint that a keeper calls and the contract executes. Both yield "no user signing" for the yield leg.

### 2.3 Strategic DeFi planner (default)

- **Role:** Decides *how much* and *where* to allocate (which Defindex strategy, and optionally Blend), based on:
  - Policy (e.g. risk tier, max % per strategy).
  - Current allocation and liquidity needs (e.g. don't lock funds needed for imminent disbursements).
- **Implementation:** Can be (1) a Soroban contract that holds configuration and is invoked by a keeper/backend, or (2) backend logic that builds and submits the appropriate Soroban txs (e.g. call org contract's `rebalance_idle` or router's `deposit_from_org(org, amount)`). In both cases it runs "in the background" from the org's perspective.
- **Default:** One default strategy (e.g. Defindex conservative) or a simple rule (e.g. "all idle above X USDC goes to yield router") so that NGOs get yield by default without configuration.

---

## 3. Yield Router Contract — Core Spec

### 3.1 Responsibility

- Accept USDC from **depositors** (NGO smart accounts, and optionally individual users).
- Track **per-depositor** principal (and optionally accrued yield/shares).
- Allocate and rebalance to **Defindex** strategies (and optionally Blend) according to **risk tier** and **strategy caps**.
- On **withdraw**, redeem from strategies and send USDC back to the depositor.
- Support **NGO path:** Deposits can come from an org smart account; the router does not require the org to sign on every deposit if the org contract or planner is authorized to push funds (see §2).

### 3.2 State (router contract)

| State | Description |
|------|-------------|
| `token` | USDC Soroban token contract address. |
| `depositor_balance` | `Map<Address, i128>` — principal attributed to each depositor. |
| `strategy_list` | List of (strategy_id, risk_tier, allocation_cap_pct). |
| `total_allocated_per_strategy` | Per-strategy total USDC (or receipt tokens) the router has deployed. |
| `config` | Fee (e.g. 10% of yield to Sozu), admin, approved strategies. |

### 3.3 Entrypoints

**Depositor / planner facing:**

- **`deposit(env, depositor: Address, amount: i128)`**  
  - Requires: USDC transferred from `depositor` to router (or `depositor` has approved router). If the caller is the **strategic DeFi planner** (authorized), it may pass the org address as `depositor` and the org contract has already transferred USDC to the router (or the router pulls via pre-authorized path).  
  - Effect: Credit `depositor_balance[depositor] += amount`; optionally trigger rebalance.

- **`withdraw(env, amount: i128)`**  
  - Caller must `require_auth()` and be the depositor (or authorized withdrawer).  
  - Effect: Debit principal; redeem from strategies if needed; transfer USDC to caller.

**NGO / planner (no per-action org signing):**

- **`deposit_from_org(env, org: Address, amount: i128)`**  
  - Callable by **authorized planner** or keeper. Requires that `org` (NGO smart account) has transferred USDC to the router in the same tx (or prior allowance).  
  - Effect: Credit `depositor_balance[org] += amount`; rebalance into Defindex per default strategy.

**Read-only:**

- **`balance_of(env, depositor: Address) -> i128`**  
- **`total_deposited(env) -> i128`**  
- **`strategy_allocation(env, strategy_id: Address) -> i128`**

**Admin / config:**

- **`add_strategy(env, strategy_id, risk_tier, max_pct)`**  
- **`set_planner(env, planner: Address)`** — Authorize the strategic DeFi planner to call `deposit_from_org` and (if needed) rebalance.

### 3.4 Defindex / Blend integration

- Router holds Defindex strategy contract IDs; calls their deposit/supply and withdraw/redeem entrypoints (ABIs TBD in [testnet-contracts.md](./testnet-contracts.md)).
- **Strategic planner** uses a **default** allocation (e.g. 100% to one Defindex strategy, or a fixed split by risk). Rebalance can be triggered after deposit or on a schedule (keeper).

---

## 4. End-to-End: NGO Idle USDC → Yield (No User Signing)

1. NGO smart account (C) holds USDC; part is reserved for upcoming payouts, rest is idle.
2. **Strategic DeFi planner** (background): Determines idle amount (e.g. balance above threshold or "sweep 80% of excess").
3. Planner (or keeper) invokes either:
   - **Path A:** Org contract's `rebalance_idle(env)` → contract transfers USDC to yield router and (optionally) calls router's `deposit(env, org, amount)`; or
   - **Path B:** Router's `deposit_from_org(env, org, amount)` with USDC already sent from org to router in same tx (org contract logic or planner does the transfer).
4. Router credits org's balance and allocates to Defindex (default strategy).
5. When NGO needs to disburse: backend/org first calls router's `withdraw(env)` with org as signer (or planner pulls back on behalf of org); USDC returns to org smart account; then org's `payout(recipient, amount)` runs as today.

---

## 5. Individual Users (Optional)

- **Users** (Sozu Wallet) may use the **same** yield router with **explicit signing**: user signs `deposit(amount)` / `withdraw(amount)` and optionally `set_preference(risk_tier)`. No "planner" for users unless we add it later; principal is still non-custodial (user key controls deposit/withdraw).
- NGO path remains distinct: **org = smart account + default strategic DeFi planner, no user signing** for the yield leg.

---

## 6. Document References

| Topic | Document |
|-------|----------|
| Architecture, org wallet, vault | [architecture-microcredit-disbursement.md](../01-architecture/architecture-microcredit-disbursement.md) |
| Org wallet Phase 2, Soroban disbursement | [org-wallet-design.md](../01-architecture/org-wallet-design.md), [soroban-disbursement-contract.md](./soroban-disbursement-contract.md) |
| Defindex/Blend, testnet addresses | [testnet-contracts.md](./testnet-contracts.md) |
| NGO dev plan, yield | [ngo-disbursement-wallet-dev-plan.md](../03-planning/ngo-disbursement-wallet-dev-plan.md) |
| 30-day sprint, out of scope | [30day-sprint-plan.md](../03-planning/30day-sprint-plan.md) |

---

## Document History

| Version | Date | Change |
|---------|------|--------|
| 0.1 | 2026-03-03 | Initial: yield router contract spec; NGO smart accounts with baked-in Defindex targeting; strategic DeFi planner, no user signing. |
