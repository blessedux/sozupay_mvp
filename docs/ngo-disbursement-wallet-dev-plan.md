# NGO Disbursement Tool & Sozu Wallet — Dev Plan

Focused development plan for **Year 1** foundation: NGO microcredit disbursement, Sozu Wallet for recipients, native DeFi (Blend/Defindex), and offramping (MoneyGram). Tied to [roadmap.md](./roadmap.md).

**Scope:** Argentina, USDC on Stellar, non-custodial wallet, behavioral credit pilot.

**First NGO partner:** MUJERES 2000 — requirements from [Requerimientos_funcionales_MUJERES_2000.pdf](./Requerimientos_funcionales_MUJERES_2000.pdf).

---

## 1. First NGO Partner: MUJERES 2000 — Requirement Summary

The EMPRENDE microcredit program is digitized end-to-end with **two profiles**:

| Profile | Role |
|--------|------|
| **Emprendedora** | Recipient: applies for credit, sees balance/cuotas, pays, uses simulator, receives notifications. |
| **Equipo interno MUJERES 2000** | NGO staff: evaluates applications, configures terms, confirms payments, views indicators, exports to Salesforce. |

**Modules (from PDF) — implementation order below:**

| # | Module | Emprendedora | Equipo M2000 |
|---|--------|--------------|--------------|
| 1 | **Solicitud de Crédito** | Digital application form (replaces Excel) | — |
| 2 | **Renovación de Crédito** | — | Renewal form + performance evaluation (semáforo) + checklists |
| 3 | **Simulador de Crédito** | Enter monto, choose cuotas; see cuota + total | Editable TNA, mora parameter; rate changes don’t affect existing credits |
| 4 | **Gestión de Pagos** | Credit state, calendar, notifications | Confirm payment (manual/auto), comments if rejected; mora, history, ranking, reports |
| 5 | **Indicadores automáticos** | — | Mora rate, total lent, recovered, active credits, renewals, compliance by barrio |
| 6 | **Integración Salesforce** | — | Sync data, credit state, payment history; export reports |
| 7 | **UX (población)** | Simple language, clear design, big buttons, few steps per screen, initial tutorial | Same for staff where applicable |

---

## 2. Overview and Sequencing

| Block | Timeline | Deliverables |
|-------|----------|--------------|
| **1. Core Infrastructure** | Months 0–3 | Sozu Wallet (non-custodial), USDC on Stellar, Soroban contracts, Defindex/Blend yield |
| **2. Loan Application & Beneficiaries** | Months 2–4 | Digital loan application (MUJERES 2000 §1–2); beneficiary data model; bulk upload; link to wallet |
| **3. Disbursement & Schedules** | Months 3–5 | Schedules, batch disbursement, allocation from vault; production-disbursements alignment |
| **4. Credit Simulator** | Months 4–5 | Simulator (monto, cuotas, TNA, mora, French system); configurable by staff |
| **5. Payment Management** | Months 4–6 | Emprendedora: credit state, calendar, notifications; Equipo: confirm payment, comments, mora, history, ranking, reports |
| **6. Renewal & Performance** | Months 5–7 | Renewal form; performance evaluation (semáforo); checklists (monotributo, capitalización, etc.) |
| **7. Indicators & Reports** | Months 5–6 | Auto indicators (mora, lent, recovered, active, renewals, compliance by barrio); downloadable reports |
| **8. Salesforce Integration** | Months 6–8 | Sync emprendedora data, credit state, payment history; export reports |
| **9. Behavioral Credit Layer** | Months 4–8 | Trust Score, borrowing caps, pilot micro-loans via Blend |
| **10. Onboarding & Offramp** | Months 6–12 | NGO go-live, 500–2k recipients, MoneyGram ARS cash-out |

Dependencies: Application & beneficiaries (2) feed disbursement (3); simulator (4) and payment management (5) need disbursement data; renewal (6) and indicators (7) need payment history; Salesforce (8) consumes all of the above.

---

## 3. Core Infrastructure (Months 0–3)

### 3.1 Sozu Wallet (Non-Custodial)

| Task | Description | Priority |
|------|-------------|----------|
| **Stellar-based wallet** | Create/receive/send USDC on Stellar; display balance. | P0 |
| **ARS default display** | Local currency conversion layer (API or oracle) so UI shows ARS by default. | P0 |
| **Passkey/MPC key management** | No custody; keys never leave user device or MPC enclave. | P0 |
| **Account creation & recovery** | Onboarding flow; recovery (e.g. social or backup) without custody. | P0 |
| **Transaction history** | List sends/receives with amount, counterparty, date, Stellar link. | P1 |

**Outcome:** Recipients (emprendedoras) can hold and use USDC in a non-custodial wallet with ARS display.

### 3.2 USDC on Stellar & Soroban

| Task | Description | Priority |
|------|-------------|----------|
| **USDC on Stellar integration** | Use existing USDC (Stellar native or wrapped); ensure wallet and backend use same asset. | P0 |
| **NGO allocation vault (Soroban)** | Smart contract(s) for NGO allocation pool; rules for who can disburse and caps. | P0 |
| **Disbursement tracking (Soroban)** | Record disbursement events onchain (amount, recipient, schedule id, timestamp). | P0 |
| **Repayment tracking (Soroban)** | Record repayments (amount, from, to vault/treasury, timestamp). | P0 |
| **Trust score emission (Soroban)** | Contract or oracle that reads repayment/wallet data and emits or stores trust score / trust points. | P1 |

**Outcome:** Onchain audit trail for allocations, disbursements, repayments, and (later) trust metrics.

### 3.3 Native DeFi — Defindex & Blend

| Task | Description | Priority |
|------|-------------|----------|
| **Defindex strategies** | Integrate Defindex; auto-deploy idle USDC (vault/treasury) into approved strategies. | P0 |
| **Blend integration** | Use Blend for yield and/or pilot lending (aligned with behavioral credit in Block 9). | P0 |
| **Auto-compounding yield** | Logic to compound yield on allocated balances; configurable by NGO or treasury. | P1 |
| **Yield reporting** | Dashboard or API: current APY, accrued yield, strategy allocation. | P2 |

**Outcome:** Idle USDC earns yield; path for microcredit pilot via Blend.

---

## 4. Loan Application & Beneficiaries (Months 2–4) — MUJERES 2000 Module 1

Digital loan application replaces the current Excel form. Data feeds beneficiary record and (later) disbursement.

### 4.1 Solicitud de Crédito — Digital Form (Emprendedora)

| Task | Description | Priority | PDF ref |
|------|-------------|----------|---------|
| **Datos Generales** | Form fields: Apellido y nombre, DNI, Fecha nacimiento, Barrio, Dirección, Estado civil, Nivel educativo, Teléfono, Cantidad personas hogar, Cantidad que generan ingresos, ¿Recibe plan social?, ¿Otro empleo?, ¿En blanco?, ¿Monotributo?, Cuenta bancaria (Banco, CBU, CVU). | P0 | §2.1 |
| **Información del Emprendimiento** | Rubro (comercial/productivo/servicio), Descripción, ¿En funcionamiento?, Antigüedad, Objetivo, Uso ganancia, Estacionalidad, Proveedores, Clientes, Modalidad cobro, Promoción, Competencia, Diferenciación. | P0 | §2.2 |
| **Producción y Organización** | Personas que participan, Distribución tareas, Horas semanales, Bienes de capital. | P0 | §2.4 |
| **Redes Sociales** | Instagram, Facebook, Otros. | P1 | §2.4 |
| **Documentación** | Upload: fotos emprendimiento, presupuesto emprendimiento, presupuesto familiar, ventas. | P0 | §2.5 |
| **Submit and link to beneficiary** | On submit: create/update beneficiary; link to Stellar address (or create wallet); store in DB for Equipo evaluation. | P0 | — |

### 4.2 Beneficiary Data Model & Bulk (Equipo)

| Task | Description | Priority |
|------|-------------|----------|
| **Beneficiary record** | DB: identity (DNI, name, contact), application snapshot, bank/CBU/CVU, Stellar address, NGO-assigned id. | P0 |
| **Bulk upload beneficiaries** | CSV or form: Stellar address and/or DNI/identifier; validate; store. Optional: map CSV columns to application fields. | P0 |
| **Application list and status** | Equipo view: list applications (pending/approved/rejected); link to full form and to beneficiary. | P0 |
| **Approve/reject with comments** | Equipo can approve or reject; if rejected, comments visible to emprendedora (MUJERES 2000 §4). | P0 |

**Outcome:** Emprendedora submits digital application; Equipo sees applications, approves/rejects; beneficiary record ready for disbursement.

---

## 5. Disbursement & Schedules (Months 3–5)

Align with [production-disbursements-tasks.md](./production-disbursements-tasks.md) for persistence, batch model, and execution.

| Task | Description | Priority |
|------|-------------|----------|
| **Disbursement schedules** | Define schedules (amount, frequency, start/end); link to beneficiaries or groups. | P0 |
| **Allocate USDC to schedule** | Allocate funds from NGO vault/treasury to a schedule; onchain where applicable. | P0 |
| **Batch disbursement execution** | Create batch from schedule; execute per production-disbursements-tasks (concurrency, idempotency, Stellar submit). | P0 |
| **Set repayment terms** | Per beneficiary or product: amount, due date, frequency (cuotas); store and show in dashboard and emprendedora app. | P0 |

**Outcome:** SozuPay creates schedules, allocates funds, runs batch disbursements to Stellar; repayment terms stored for payment management.

---

## 6. Credit Simulator (Months 4–5) — MUJERES 2000 Module 3

| Task | Description | Priority | PDF ref |
|------|-------------|----------|---------|
| **Emprendedora: simulator UI** | Enter monto deseado; choose cantidad de cuotas (e.g. 6, 9, 12); see cuota mensual o semanal and total a pagar. | P0 | §4 |
| **French system (sistema francés)** | Simulation with French amortization; configurable TNA. | P0 | §4 |
| **Staff: editable TNA** | Equipo can set/edit Tasa Nominal Anual; change does not affect credits already granted. | P0 | §4 |
| **Configurable mora** | Parameter for mora (overdue); used in simulator and in payment management (días de mora). | P0 | §4 |

**Outcome:** Emprendedora simulates credit before applying; Equipo controls TNA and mora globally.

---

## 7. Payment Management (Months 4–6) — MUJERES 2000 Module 4

### 7.1 Emprendedora View

| Task | Description | Priority | PDF ref |
|------|-------------|----------|---------|
| **Credit state** | Show: total otorgado, total pagado, saldo pendiente, cuotas pagas, cuotas restantes. | P0 | §5 |
| **Calendar of vencimientos** | Calendar view of due dates. | P0 | §5 |
| **Notifications** | “Tu cuota vence en 3 días”; “Tenés X días de mora.” (Push or in-app.) | P0 | §5 |
| **Approval/rejection feedback** | After Equipo approves or rejects credit, emprendedora sees status; if rejected, see comments. | P0 | §5 |

### 7.2 Equipo View (SozuPay Dashboard)

| Task | Description | Priority | PDF ref |
|------|-------------|----------|---------|
| **Confirm payment** | Manual or automatic confirmation of payment; emprendedora sees approval. | P0 | §5 |
| **Rejection with comments** | When rejecting, leave comments; emprendedora sees why. | P0 | §5 |
| **Mora por días** | View overdue by days (días de mora). | P0 | §5 |
| **Historial de pagos** | Payment history per beneficiary. | P0 | §5 |
| **Ranking de cumplimiento** | Ranking of compliance (who pays on time). | P0 | §5 |
| **Download reportes** | Export payment/credit reports (CSV or PDF). | P0 | §5 |
| **Real-time transparency** | High-level: total disbursed, repaid, outstanding, delinquency rate. | P0 | — |
| **Onchain explorer link** | Link to Stellar explorer for disbursement and repayment txs. | P1 | — |
| **Trust score monitoring** | Per-recipient trust score / trust points (Soroban or backend). | P1 | — |

**Outcome:** Emprendedora sees credit state, calendar, and notifications; Equipo confirms payments, sees mora, history, ranking, and reports.

---

## 8. Renewal & Performance (Months 5–7) — MUJERES 2000 Module 2

| Task | Description | Priority | PDF ref |
|------|-------------|----------|---------|
| **Renewal form (Equipo)** | Form replicating current renovación: datos del crédito anterior (saldo, monto último, fechas, cantidad cuotas). | P0 | §3.1 |
| **Evaluación del desempeño** | Semáforo or score: Actividad (Muy bueno/Bueno/Regular/Malo), Pago de cuotas, Asistencia, Evolución del emprendimiento. | P0 | §3.2 |
| **Checklists** | Digital checklists: Monotributo, Capitalización, Incremento canales de venta. | P0 | §3.2 |
| **Link renewal to Trust Score** | Renewal performance feeds into Trust Score / borrowing caps (Block 9). | P1 | — |

**Outcome:** Equipo manages renewals with structured evaluation and checklists; data feeds behavioral credit.

---

## 9. Indicators & Reports (Months 5–6) — MUJERES 2000 Module 5

| Task | Description | Priority | PDF ref |
|------|-------------|----------|---------|
| **Tasa de mora general** | Automatic mora rate (portfolio-level). | P0 | §6 |
| **Monto total prestado** | Total lent. | P0 | §6 |
| **Monto recuperado** | Total recovered. | P0 | §6 |
| **Créditos activos** | Count and volume of active credits. | P0 | §6 |
| **Renovaciones** | Renewal count / rate. | P0 | §6 |
| **Nivel de cumplimiento por barrio** | Compliance (e.g. on-time rate) by neighborhood (barrio). | P0 | §6 |
| **Reportes descargables** | All above (and payment history) available in downloadable reports. | P0 | §5–6 |

**Outcome:** Dashboard shows auto indicators and supports export for MUJERES 2000 and Salesforce.

---

## 10. Salesforce Integration (Months 6–8) — MUJERES 2000 Module 6

| Task | Description | Priority | PDF ref |
|------|-------------|----------|---------|
| **Sync emprendedora data** | Automatic sync of beneficiary/application data to Salesforce. | P0 | §7 |
| **Credit state sync** | Update credit state (disbursed, balance, status) in Salesforce. | P0 | §7 |
| **Payment history** | Register historical payments in Salesforce. | P0 | §7 |
| **Export reportes** | Ability to export reports (aligned with §9) for Salesforce or external use. | P0 | §7 |

**Outcome:** Single source of truth in SozuPay; Salesforce stays in sync for MUJERES 2000 workflows.

---

## 11. Behavioral Credit Layer (Months 4–8)

| Task | Description | Priority |
|------|-------------|----------|
| **Trust score inputs** | On-time repayments, wallet usage, balance stability, spending signals; align with renewal evaluación. | P0 |
| **Trust Points (onchain)** | Non-transferable metric on Soroban; update on repayment and (optionally) wallet events. | P0 |
| **Borrowing caps by score** | Configurable caps per trust tier; enforce in disbursement and (later) Blend wrapper. | P0 |
| **Pilot micro-loans via Blend** | Undercollateralized micro-loans for recipients above threshold; small pilot. | P1 |

**Outcome:** First behavioral undercollateralized microcredit test; renewal and payment data feed trust.

---

## 12. Onboarding & Offramping (Months 6–12)

### 12.1 NGO & Recipient Onboarding

| Task | Description | Priority |
|------|-------------|----------|
| **MUJERES 2000 go-live** | Legal/ops onboarding; KYC/AML where required; SozuPay + wallet distribution. | P0 |
| **Recipient onboarding (500–2k)** | Use NGO distribution as wallet distribution; minimal-friction signup (passkey/MPC). | P0 |
| **Behavioral data pipeline** | Wallet and repayment events feed trust score and analytics (PII handled per compliance). | P0 |

### 12.2 Offramp — MoneyGram

| Task | Description | Priority |
|------|-------------|----------|
| **MoneyGram integration** | ARS cash-out from Sozu Wallet (e.g. cash pickup or bank). | P0 |
| **Offramp flow in wallet** | UI: “Cash out to ARS”; amount; MoneyGram option; status and receipt. | P0 |
| **Limits and compliance** | Per-user and aggregate limits; audit trail for offramp. | P0 |
| **Settlement and reconciliation** | Reconcile USDC movement with fiat settlement; errors and retries. | P1 |

**Outcome:** Recipients can convert USDC to ARS; NGO disbursement OS is fully operational.

---

## 13. UX — Emprendedora & Equipo (MUJERES 2000 §8)

Apply across **Emprendedora app** and (where relevant) **Equipo dashboard**:

| Task | Description | Priority |
|------|-------------|----------|
| **Lenguaje simple** | Clear, simple language; avoid jargon. | P0 |
| **Diseño claro** | Clear layout and hierarchy. | P0 |
| **Botones grandes** | Large touch targets for mobile and low-vision users. | P0 |
| **Pocos pasos por pantalla** | Few steps per screen; progressive flows (e.g. application in sections). | P0 |
| **Tutorial inicial** | Initial tutorial for first-time emprendedora (and optional for Equipo). | P0 |

**Outcome:** Experience appropriate for program population and staff efficiency.

---

## 14. Milestones and Acceptance (Year 1)

| Milestone | By | Acceptance |
|-----------|-----|------------|
| **M1: Wallet live** | Month 3 | Non-custodial Sozu Wallet with USDC, ARS display, passkey/MPC. |
| **M2: Contracts & yield** | Month 3 | Vault, disbursement/repayment tracking on Soroban; Defindex/Blend yield. |
| **M3: Application & beneficiaries** | Month 4 | Digital loan application (MUJERES 2000 form); beneficiary model; approve/reject. |
| **M4: Disbursement & simulator** | Month 5 | Schedules, batch disbursement; credit simulator (TNA, cuotas, French, mora). |
| **M5: Payment management** | Month 6 | Emprendedora: credit state, calendar, notifications; Equipo: confirm, mora, history, ranking, reports. |
| **M6: Renewal & indicators** | Month 7 | Renewal form, performance evaluation, checklists; auto indicators and reportes. |
| **M7: Salesforce** | Month 8 | Sync data, credit state, payment history; export reports. |
| **M8: Trust score** | Month 8 | Trust Points onchain; borrowing caps; pilot micro-loans via Blend. |
| **M9: NGO + offramp** | Month 12 | MUJERES 2000 live; 500–2k recipients; MoneyGram ARS cash-out live. |

**Year 1 success:** Fully operational NGO disbursement OS aligned with MUJERES 2000 requirements; recipients using Sozu Wallet; repayment and yield live; first behavioral credit cycle; offramp live. Foundation for Year 2.

---

## 15. Risks and Mitigations

| Risk | Mitigation |
|------|-------------|
| MoneyGram or partner delay | Fallback (e.g. manual cash-out) and minimal integration slice. |
| Trust model too strict/loose | Pilot with small caps; iterate using renewal and payment data. |
| Stellar throughput / rate limits | Batch execution with concurrency limits and backoff (production-disbursements-tasks). |
| Key management complexity | Start with passkey-only; add MPC for recovery or multi-device if needed. |
| Salesforce schema changes | Agree sync contract early; version API; map SozuPay fields to Salesforce objects. |

---

## 16. Document History

| Version | Date | Change |
|--------|------|--------|
| 0.1 | 2026-03-01 | Initial: NGO disbursement, Sozu Wallet, DeFi, offramp. |
| 0.2 | 2026-03-01 | Aligned with MUJERES 2000 PDF: application, renewal, simulator, payment management, indicators, Salesforce, UX; reordered tasks and milestones. |
