# Sozu Ecosystem — Development Roadmap

This document organizes **development cycles and phases** for Sozu dapps and infrastructure. It is the single reference for sequencing: what we build, in what order, and why.

**Stack:** Stellar · Blend · MoneyGram  
**Principle:** No scope creep. Each phase leads to the next layer.

---

## Strategic Architecture Logic

| Phase | Focus | Outcome |
|-------|--------|---------|
| **Year 1** | Build trust + data + wallet distribution | NGO Financial OS (Foundation) |
| **Year 2** | Monetize flow (merchant settlement + credit) | Merchant Acceptance + Anchor Path |
| **Year 4** | Own the rail (anchor + hardware) | Full Payment Rail + Proprietary NFC Cards |

Each phase builds on:
- Real transaction volume
- Behavioral data
- Regulatory progression
- Liquidity depth

---

## High-Level Phasing

### Year 1 — NGO Disbursement Financial OS (Foundation)

**Objective:** Launch a working NGO microcredit disbursement + tracking system in Argentina using USDC on Stellar.

- **Months 0–3:** Core infrastructure (Sozu Wallet, USDC on Stellar, Soroban contracts, Defindex/Blend yield). For Blend: testnet contract addresses, supply/withdraw entrypoints, and backend-only vs vault-contract approach are in [testnet-contracts.md](./testnet-contracts.md#blend-integration).
- **Months 2–6:** NGO Admin Dashboard (SozuPay Phase 1 — bulk beneficiaries, disbursement schedules, repayment tracking, transparency)
- **Months 4–8:** Behavioral Credit Layer (Trust Score, borrowing caps, pilot micro-loans via Blend)
- **Months 6–12:** Onboarding (first Argentine NGO, 500–2k recipients, MoneyGram offramp live)

**Key milestone at 12 months:** Fully operational NGO disbursement OS; recipients using Sozu wallet; repayment tracking; yield auto-compounding; first behavioral credit cycle.

---

### Year 2 — Merchant Acceptance + Anchor Path

**Objective:** Customer → fiat payment → merchant receives USDC in Sozu wallet.

- **Months 12–18:** Sozu Business Wallet, revenue analytics, auto yield, revenue-based credit
- **Months 12–18:** Fiat Bridge Aggregator (Model B — PSP collects fiat, converts to USDC, settles to merchant; Sozu as routing layer; T+1/T+2)
- **Months 18–24:** Anchor preparation (compliance, KYC, fiat liquidity relationships)

**Key milestone:** Active merchant USDC settlement; revenue-based merchant credit; Anchor licensing pathway initiated.

---

### Year 4 — Full Payment Rail + Proprietary NFC Cards

**Objective:** Reduce reliance on external card networks; expand distribution.

- Sozu Merchant Network (QR + NFC, stablecoin-native settlement)
- Halo Burner Smart Contract Cards (NFC, session-based spending, programmable debit)
- Anchor status (direct fiat on/off ramp, local ARS liquidity)
- Full Financial OS distribution

**Key milestone:** Parallel USDC-native financial infrastructure (NGO microcredit + behavioral credit + merchant settlement + anchor rails + NFC cards).

---

## Development Cycle Conventions

Use this section to align sprints and releases with the roadmap.

### Cycle Types

| Type | Duration | Use for |
|------|----------|--------|
| **Infrastructure cycle** | 2–3 months | Wallet, contracts, integrations (Blend, Defindex, Stellar) |
| **Product cycle** | 1–2 months | Dashboard features, batch flows, reporting |
| **Pilot cycle** | 3–6 months | NGO onboarding, behavioral credit pilot, offramp go-live |

### Phase Gates

Before moving to the next **year-phase**:

1. **Volume & data:** Target transaction volume and behavioral data thresholds met.
2. **Regulatory:** No blocking regulatory risk for the next phase (e.g. no anchor licensing in Year 1).
3. **Liquidity & ops:** Liquidity and operational runbooks in place for the current phase.

### Document Links

| Focus | Document |
|-------|----------|
| **Insta Awards 30-day sprint** (Landing, SDP Sozu Wallet provider, Dashboard MVP) | [insta-awards-30day-sprint-plan.md](./insta-awards-30day-sprint-plan.md) |
| **NGO disbursement + Sozu wallet + DeFi + offramp** | [ngo-disbursement-wallet-dev-plan.md](./ngo-disbursement-wallet-dev-plan.md) |
| **Production dashboard & simultaneous disbursements** | [production-disbursements-tasks.md](./production-disbursements-tasks.md) |
| **Technical spec** | [technical-spec.md](./technical-spec.md) |
| **NFRs** | [nfr.md](./nfr.md) |

---

## Critical Execution Principles

**Do NOT:**

- Attempt anchor licensing in Year 1
- Attempt card issuance in Year 1
- Attempt fiat bridge before real volume

**Sequence matters.** Distribution comes from NGOs first.

---

## Ecosystem Roles (Reference)

| Actor | Role |
|-------|------|
| **NGOs** | Distribution channel, trust validator, volume generator |
| **Merchants** | Yield recipients, credit clients, revenue nodes |
| **Wallet users** | Behavioral collateral creators |

Everything feeds the credit engine.

---

## Document History

| Version | Date | Change |
|--------|------|--------|
| 0.1 | 2026-03-01 | Initial: phased roadmap (Y1, Y2, Y4) and dev cycle conventions. |
