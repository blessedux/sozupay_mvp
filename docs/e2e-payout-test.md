# E2E: Recipients persistence & multi-recipient payout

## 0. Stellar payouts: super_admin wallet and org options

Payouts support **Classic** (G account) and **Soroban** (smart contract C) flows. See [org-wallet-design.md](org-wallet-design.md) Phase 1 and Phase 2.

### Classic (Phase 1)

- If **ORG_DISBURSEMENT_SECRET** (or STELLAR_DISBURSEMENT_SECRET) is set, the org wallet can sign payouts; super_admin authorizes in the app.
- If not set, super_admin must **unlock** their payout wallet (passphrase or secret key). The app may return **Wallet locked** and show the “Unlock wallet” modal.

Only **super_admin** users can perform Stellar payouts. The payout is signed with **that user’s derived wallet**, not a shared env key.

- **No** `STELLAR_DISBURSEMENT_SECRET` – payouts do not use a single app-level key.
- The super_admin’s Stellar keypair is **derived** from a **wallet passphrase** they choose (same passphrase + user id → same key every time). The passphrase is never stored.
- When a super_admin tries to pay (Pay now or Pay multiple with Stellar recipients), the app may return **Wallet locked** and show an “Unlock wallet” modal. They enter their passphrase → key is derived and held in memory (15 min TTL) → payout is retried and signed with that key.
- **`STELLAR_FUNDER_SECRET`** in `.env` is still used for **funding new user accounts** (e.g. admin activate-user), not for Recipients payouts.

**Super_admin testnet setup:**

1. In the DB, set the test user’s `admin_level` to `super_admin`.
2. Choose a **wallet passphrase** (e.g. `mypayoutphrase`). The same passphrase + your `privy_user_id` will always derive the same Stellar keypair.
3. Derive the key once (e.g. with a small script using the same logic as `deriveKeypairFromPassphrase` in `src/lib/auth/wallet-unlock.ts`), fund that account on testnet (Friendbot), add USDC trustline and test USDC.
4. In the app, when you hit “Pay now” or “Pay selected” for Stellar recipients, enter that passphrase in the unlock modal. Payouts will be signed with the derived key.

---

## 1. Database setup

Recipients and (optional) organizations are stored in Supabase. Create tables if needed:

1. Open Supabase Dashboard → SQL Editor.
2. Run: [docs/supabase-recipients-table.sql](supabase-recipients-table.sql), [docs/supabase-users-table.sql](supabase-users-table.sql), [docs/supabase-organizations-table.sql](supabase-organizations-table.sql).
3. Ensure `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set in `.env.local`.

## 2. Verify recipients persist

1. Log in to the dashboard (or use mock auth in dev).
2. Go to **Recipients**.
3. Add 2–3 recipients (name + Stellar address and/or bank account).
4. **Refresh the page** — recipients should still be listed (no longer in-memory only).
5. Open another tab, go to Recipients again — same list.

## 3. Single payout (existing flow)

1. On Recipients, click **Pay now** for one recipient.
2. Enter amount (e.g. `1` USDC for testnet).
3. Submit — should redirect to Payouts; Stellar payout should show as completed (if destination is valid and disbursement key is funded).

## 4. Multi-recipient payout (batch)

1. On **Recipients**, click **Pay multiple**.
2. Option A – same amount for all:
   - Enter "Same amount for all" (e.g. `1`).
   - Check 2+ recipients.
   - Click **Pay selected**.
3. Option B – amount per recipient:
   - Leave "Same amount for all" empty.
   - Check 2+ recipients and fill each "Amount" field.
   - Click **Pay selected**.
4. Should redirect to **Payouts**; each selected recipient should have a payout record. Stellar payouts execute immediately; bank payouts stay pending until off-ramp.

## 5. API-level batch test (optional)

```bash
# Replace COOKIE with your session cookie if not using AUTH_MOCK.
curl -X POST http://localhost:3000/api/payouts \
  -H "Content-Type: application/json" \
  -d '{"payouts":[{"recipientId":"<uuid-1>","amount":"1"},{"recipientId":"<uuid-2>","amount":"2"}]}'
```

Use recipient IDs from `GET /api/recipients` (when logged in). On success you get `{ "payouts": [ ... ] }`.

---

## 6. NGO + Soroban (Phase 2) — sign tx and disburse e2e

When the org has a **Soroban disbursement contract** (`soroban_contract_id` set on the organization), Stellar payouts go through the contract: super-admin signs the invocation; the contract checks the signer and transfers USDC to the recipient.

### Prerequisites

- **Organizations table** with at least one org; set the super_admin user’s `org_id` to that org.
- **Contract deployed**: build and deploy the disbursement wallet from `contracts/disbursement_wallet/` (see [docs/soroban-disbursement-contract.md](soroban-disbursement-contract.md)). Initialize it with the USDC token address and the super_admin’s public key as authorized signer. Fund the contract with USDC.
- Set the org’s **soroban_contract_id** (C address) in the `organizations` table.
- **SOROBAN_RPC_URL** in `.env.local` (e.g. `https://soroban-testnet.stellar.org`).
- Super_admin has set a **payout wallet** (passphrase or registered key) and can unlock it.

### E2E steps

1. Log in as super_admin; ensure your user has `org_id` pointing to an org that has `soroban_contract_id` set.
2. Go to **Recipients** and add a recipient with a Stellar address (G or C).
3. Click **Pay now**, enter amount (e.g. `1` USDC).
4. If the app returns **Wallet locked** / **requireUnlock**, open the unlock modal and enter your passphrase (or secret key). Retry the payout.
5. After success, you are redirected to **Payouts**; the payout shows **completed** with a transaction hash.
6. Confirm the tx on a Soroban/Stellar explorer (testnet): the transaction should show the contract invocation and the admin as signer.

### Batch (Pay multiple)

Same as above: select multiple Stellar recipients, enter amounts, click **Pay selected**. Unlock if prompted. All selected Stellar payouts are sent via the contract in sequence.
