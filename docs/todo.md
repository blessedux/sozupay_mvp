# SozuPay Dashboard – Task List

**Context:** Phases 1–10 are the **foundation** (dashboard shell, auth, wallet, walls, e-commerce, payouts). They are complete. The **current focus** is **Year 1 NGO disbursement** per [roadmap.md](roadmap.md), with the first NGO partner **MUJERES 2000**. Detailed tasks and order are in [ngo-disbursement-wallet-dev-plan.md](ngo-disbursement-wallet-dev-plan.md) (aligned with [Requerimientos_funcionales_MUJERES_2000.pdf](Requerimientos_funcionales_MUJERES_2000.pdf)).

---

## Phase 1–10: Foundation (complete)

Based on [docs/technical-spec.md](docs/technical-spec.md). Used for merchant/recipient payouts, walls, and e-commerce.

- [x] **Phase 1:** Next.js app, TypeScript, Stellar/Horizon, README, runbooks, health API
- [x] **Phase 2:** Magic link / email OTP auth, 2FA, onboarding checklist
- [x] **Phase 3:** Stellar account (USDC), recovery, Keys & custody in dashboard
- [x] **Phase 4:** USDC balance, fiat display, transaction list, vault view, Horizon/DB
- [x] **Phase 5:** 2FA for bank/recovery/large payouts; audit log
- [x] **Phase 6:** Payment walls (create/edit, shareable link, QR, on-ramp)
- [x] **Phase 7:** E-commerce checkout, webhooks, Shopify/WooCommerce
- [x] **Phase 8:** Bank accounts, off-ramp, payout history, send to Stellar address
- [x] **Phase 9:** Recipients, one-off payouts, optional scheduled payouts
- [x] **Phase 10:** NFRs (latency, availability, responsive, accessibility)

---

## Current focus: NGO disbursement & MUJERES 2000 (Year 1)

Tracked in detail in **[ngo-disbursement-wallet-dev-plan.md](ngo-disbursement-wallet-dev-plan.md)**. This section is a high-level checklist aligned with that plan and the MUJERES 2000 requirements.

**Insta Awards 30-day sprint:** See **[insta-awards-30day-sprint-plan.md](insta-awards-30day-sprint-plan.md)** for scope: (1) Conversion landing page, (2) Sozu Wallet as SDP provider, (3) NGO Dashboard MVP — persistence + single on-chain payout (Phases A+B).

### Core infrastructure (Months 0–3)

- [ ] Sozu Wallet: non-custodial, USDC on Stellar, ARS default display, passkey/MPC
- [ ] Soroban: NGO vault, disbursement/repayment tracking, trust score emission
- [ ] Defindex/Blend: auto yield, auto-compounding

### Loan application & beneficiaries (Months 2–4) — Module 1

- [ ] Digital loan application form (Datos Generales, Emprendimiento, Producción, Redes, Documentación)
- [ ] Beneficiary data model; bulk upload; application list and approve/reject with comments

### Disbursement & simulator (Months 3–5) — Modules 3–4

- [ ] Schedules, allocation, batch disbursement (see [production-disbursements-tasks.md](production-disbursements-tasks.md))
- [ ] Credit simulator: monto, cuotas, TNA, mora, French system; staff-editable TNA

### Payment management (Months 4–6) — Module 4

- [ ] **Emprendedora:** Credit state (otorgado/pagado/pendiente, cuotas), calendar, notifications, approval/rejection feedback
- [ ] **Equipo:** Confirm payment (manual/auto), comments if rejected, mora por días, historial, ranking cumplimiento, reportes

### Renewal, indicators, Salesforce (Months 5–8) — Modules 2, 5, 6

- [ ] Renewal form; evaluación desempeño (semáforo); checklists (Monotributo, Capitalización, etc.)
- [ ] Indicadores: mora, total prestado/recuperado, créditos activos, renovaciones, cumplimiento por barrio; reportes descargables
- [ ] Salesforce: sync emprendedora data, credit state, payment history; export reportes

### Behavioral credit & offramp (Months 4–12)

- [ ] Trust Score inputs, Trust Points onchain, borrowing caps; pilot micro-loans via Blend
- [ ] MoneyGram offramp: integration, wallet UI, limits, reconciliation
- [ ] MUJERES 2000 go-live; 500–2k recipients

### UX (MUJERES 2000 §8)

- [ ] Lenguaje simple, diseño claro, botones grandes, pocos pasos por pantalla, tutorial inicial

---

## Reference

| Doc | Purpose |
|-----|--------|
| [roadmap.md](roadmap.md) | Year 1 / 2 / 4 phasing; dev cycle conventions |
| [ngo-disbursement-wallet-dev-plan.md](ngo-disbursement-wallet-dev-plan.md) | Full task list, order, MUJERES 2000 mapping, milestones |
| [production-disbursements-tasks.md](production-disbursements-tasks.md) | Batch disbursement, persistence, execution |
| [Requerimientos_funcionales_MUJERES_2000.pdf](Requerimientos_funcionales_MUJERES_2000.pdf) | First NGO partner requirements |
