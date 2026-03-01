# SozuPay Dashboard

Dashboard for the **EMPRENDE microcredit program** with our first NGO partner **MUJERES 2000**. Used by **Equipo interno** (staff) to manage beneficiaries, disbursements, repayments, and reporting. Roadmap and feature scope are driven by [MUJERES 2000 requirements](docs/Requerimientos_funcionales_MUJERES_2000.pdf) and documented in [docs/ngo-disbursement-wallet-dev-plan.md](docs/ngo-disbursement-wallet-dev-plan.md) and [docs/todo.md](docs/todo.md).

---

## Who uses the app

| Role | Description |
|------|-------------|
| **Equipo MUJERES 2000** | NGO staff: evaluate applications, set disbursement schedules, confirm payments, view indicators, export reports. Uses this dashboard. |
| **Emprendedora** | Recipient: apply for credit, see balance and cuotas, pay, use simulator. (Recipient-facing app and Sozu Wallet are in development.) |

---

## Architecture (simple)

```
┌─────────────────────────────────────────────────────────────┐
│  SozuPay Dashboard (this repo)                               │
│  Next.js · API routes · Stellar Horizon (USDC)               │
├─────────────────────────────────────────────────────────────┤
│  /login → /dashboard                                        │
│  Dashboard: Overview, Transactions, Vault, Payment walls,   │
│  Payouts, Recipients, Keys, Audit, Settings                 │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
  Stellar (testnet/mainnet) · USDC · Horizon API
```

- **Frontend:** Next.js (React), TypeScript, Tailwind.
- **Backend:** Next.js API routes; Stellar Horizon for balance and transactions (keys and signing on server).
- **Auth:** Mock for demo (one click to dashboard); real auth and Sozu Wallet for recipients later.

---

## Quick start (developers)

```bash
npm install
cp .env.example .env.local   # optional; mock auth works without it in dev
npm run dev
```

- **App:** [http://localhost:3000](http://localhost:3000)
- **Health:** [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## How to use the app (as a user)

1. **Open the app**  
   Go to the app URL (e.g. `http://localhost:3000` or your production URL).

2. **Sign in (demo)**  
   On the login page, click **“Send magic link”**. You are taken straight to the dashboard (no email needed in demo mode).

3. **Dashboard**  
   - **Overview** — Balance, recent activity, shortcuts.
   - **Transactions** — List of USDC movements with Stellar links.
   - **Vault** — Yield and accrued balance.
   - **Payment walls** — Create shareable pay links and QR.
   - **Payouts** — Send USDC to Stellar addresses or bank (recipients).
   - **Recipients** — Manage payout recipients (name, bank).
   - **Keys & custody** — View recovery and key info.
   - **Audit log** — Sensitive actions (bank added, recovery changed, payouts).
   - **Settings** — Profile and preferences.

4. **Production**  
   Set `NEXT_PUBLIC_APP_URL` in your deployment (or the app will use the request host for redirects). For real auth later, set `AUTH_MOCK=false`.

---

## Feature scope and roadmap

- **Done:** Dashboard foundation (auth, wallet, balance, transactions, walls, payouts, recipients, audit). See [docs/todo.md](docs/todo.md) Phase 1–10.
- **Current focus:** NGO disbursement and MUJERES 2000: loan application, beneficiaries, disbursement schedules, credit simulator, payment management, renewal, indicators, Salesforce. See [docs/ngo-disbursement-wallet-dev-plan.md](docs/ngo-disbursement-wallet-dev-plan.md) and [docs/todo.md](docs/todo.md).

---

## Docs

| Doc | Purpose |
|-----|--------|
| [docs/todo.md](docs/todo.md) | Task list and current focus (MUJERES 2000) |
| [docs/ngo-disbursement-wallet-dev-plan.md](docs/ngo-disbursement-wallet-dev-plan.md) | Full dev plan, MUJERES 2000 modules, milestones |
| [docs/roadmap.md](docs/roadmap.md) | Year 1 / 2 / 4 phasing |
| [docs/runbooks.md](docs/runbooks.md) | Local dev, env vars, plug-in points |
| [docs/technical-spec.md](docs/technical-spec.md) | Technical spec (foundation) |

---

## License

Private – Sozu Capital.
