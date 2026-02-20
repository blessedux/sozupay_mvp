# SozuPay Dashboard

Merchant-facing dashboard for SozuPay: one wallet, one source of truth for balance, transactions, vault, payment walls, e-commerce, and payouts. See [docs/technical-spec.md](docs/technical-spec.md) and [docs/onepager.md](docs/onepager.md).

## Stack

- **Frontend:** Next.js (React), TypeScript, Tailwind CSS
- **Backend:** Next.js API routes; Stellar Horizon (backend only, no key handling in frontend)
- **Auth / wallet / off-ramp / vault:** Implemented per phased plan; see [docs/runbooks.md](docs/runbooks.md) for env and plug-in points

## Quick start

```bash
npm install
cp .env.example .env.local   # edit as needed
npm run dev
```

- App: [http://localhost:3000](http://localhost:3000)
- Health: [http://localhost:3000/api/health](http://localhost:3000/api/health)

## Docs

- [Technical spec](docs/technical-spec.md)
- [Runbooks (local dev, env vars, plug-in points)](docs/runbooks.md)
- [NFRs (performance, availability, compliance)](docs/nfr.md)
- [E-commerce integration](docs/ecommerce-integration.md)
- [Task list](todo.md)

## License

Private – Sozu Capital.
