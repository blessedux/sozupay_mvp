# Non-functional requirements

## Performance

- **Balance and recent transactions:** Load in &lt;2s. The dashboard calls Horizon (and optional indexer) for balance and payment history; use caching or read replicas if needed to meet this under load.
- **Payouts and off-ramp:** Status updates clear and timely; partner adapter should expose status so the dashboard can show completion or failure.

## Availability

- **Target:** Dashboard and API 99.9% uptime.
- **Stellar independence:** Settlement and on-chain state are independent of our availability. If the dashboard is down, Stellar transactions and balances remain correct; users can verify via Stellar Expert.

## Compliance and verification

- **Off-ramp and bank linkages** follow partner and local rules.
- **Optional verification:** For off-ramp and/or higher limits, collect minimal business/bank details as required by the off-ramp partner. Can be done when the merchant first adds a bank account (see Settings → Verification).
- **Privacy:** No KYC on core onboarding where legally possible; minimal data for off-ramp and fraud prevention.

## Responsive and accessibility

- Dashboard is responsive for desktop and mobile (Tailwind breakpoints, collapsible nav on small screens).
- Basic accessibility: semantic landmarks, focus management on forms and modals, sufficient contrast. Compliance notes and full a11y audit can be added as needed.
