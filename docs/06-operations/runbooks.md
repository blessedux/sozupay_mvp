# SozuPay Dashboard – Runbooks

## Local development

1. **Prerequisites:** Node.js 20+, npm.
2. **Install:** `npm install`
3. **Env:** Copy `.env.example` to `.env.local` and set at least:
   - `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000`)
   - `HORIZON_URL` for Stellar (defaults to testnet if unset)
4. **Run:** `npm run dev` – app at [http://localhost:3000](http://localhost:3000).
5. **Health:** [http://localhost:3000/api/health](http://localhost:3000/api/health) returns JSON `{ status: "ok", ... }`.

## Environment variables

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_APP_URL` | Frontend + backend | Base URL of the app |
| `HORIZON_URL` | Backend only | Stellar Horizon API (testnet/public) |
| `STELLAR_NETWORK` | Backend only | `testnet` or `public` |
| Auth (Phase 2) | Backend | Magic link / OTP provider keys |
| Off-ramp (Phase 8) | Backend | Partner adapter env vars |
| Vault (Phase 4) | Backend | Vault protocol env vars |
| Key derivation (§7) | Backend | Separate security spec – plug-in point |

Never expose secret keys or server-side secrets to the frontend.

## Out-of-scope plug-in points (per spec §7)

- **Key derivation / backup:** Stellar key derivation and backup encryption schema are in a separate security spec. Backend wallet abstraction will call into this when implemented.
- **Off-ramp partner:** Exact partner APIs and fee structure are integrated via an adapter; configure with `OFF_RAMP_*` (or similar) env vars.
- **Yield / vault:** DeFi or institutional yield product (e.g. Aave) integration is in a separate vault spec; use `VAULT_*` for configuration.
- **2FA provider:** TOTP/SMS provider and rate limits are implementation detail; auth layer will plug in here.

## Build and start

- **Build:** `npm run build`
- **Start (production):** `npm run start`
- **Lint:** `npm run lint`
