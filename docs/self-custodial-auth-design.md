# Self-custodial auth & wallet design

**Principle:** We never hold users’ keys or funds. Each user creates and controls their own Stellar wallet; only the user holds the secret/recovery. We store only public keys and access-control data (allowlist, admin, org).

---

## 1. Design principles

| Principle | Meaning |
|-----------|--------|
| **No key custody** | We never store, see, or handle user secret keys or recovery phrases. Keys are generated and stored only by the user (client-side or their own backup). |
| **No fund custody** | We never hold user funds. All USDC/XLM live in the user’s own Stellar account. We only read balances and show “send to this address” / Friendbot. |
| **User proves ownership** | User registers their **Stellar public key** with us after proving they control it (e.g. sign a message). We store only the public key. |
| **Super admin gate** | Only a super admin can allowlist new users and grant admin. Only super admin (and optionally admins) can perform payment actions (e.g. disburse from org treasury). |
| **Allowlist + org space** | Only allowlisted users can enter a given org. Each user has exactly one wallet (one Stellar public key) linked to their profile. |

---

## 2. High-level flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  USER (browser / device)                                                     │
│  1. Login with Privy (email, passkey)                                        │
│  2. Create wallet: generate Stellar keypair CLIENT-SIDE                      │
│  3. User backs up secret / recovery (we never see it)                         │
│  4. Register: send PUBLIC KEY + signature to backend                          │
│  5. Backend stores: privy_user_id, email, stellar_public_key, allowed=false  │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  BACKEND (we store only)                                                      │
│  • privy_user_id, email                                                       │
│  • stellar_public_key (user-registered, not we-generated)                     │
│  • allowed (boolean) — set true only by super admin                           │
│  • admin_level (user | admin | super_admin)                                   │
│  • org_id (which org space this user can enter)                               │
│  NO: secret keys, recovery phrases, encrypted private keys, custody of funds │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  SUPER ADMIN                                                                 │
│  • Allowlist: set allowed=true for new users (so they can enter org space)   │
│  • Grant admin: set admin_level=admin (so they can handle payments)           │
│  • Only super_admin (and admins if we allow) can execute payment flows        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Wallet creation (fully self-custodial)

1. **Keypair generation (client-side only)**  
   In the browser (or future mobile app), after Privy login:
   - Use Stellar SDK to generate a new keypair: `Keypair.random()` (or equivalent).
   - Show the user their **secret key / recovery** once; user must save it. We never send it to the server.
   - Derive and display **public key** (Stellar account id / address).

2. **Proof of ownership**  
   So we know the user controls that address:
   - User signs a short message (e.g. “SozuPay registration” + timestamp) with their Stellar secret key (client-side).
   - Client sends to backend: `{ stellar_public_key, message, signature }`.
   - Backend verifies the signature against the public key. If valid, we accept this wallet as theirs.

3. **Registration (backend)**  
   - Store: `privy_user_id` (from session), `stellar_public_key`, `allowed = false`, `admin_level = user`, `org_id` (if applicable).
   - Never store secret key or signature long-term (signature is only for the one-time proof).

4. **Activation (user does it, we don’t hold funds)**  
   - We show: “Your Stellar address: G...” and a link to **Friendbot** (testnet) so the user can fund their own account.
   - User opens Friendbot, enters their address, receives XLM. User (or our UI with client-side signing) can then add USDC trustline and receive USDC.
   - No server-side funding from us; no keys or funds in our DB.

---

## 4. What we store (DB / backend)

| Field | Purpose | We never store |
|-------|---------|----------------|
| `privy_user_id` | Link to Privy identity | — |
| `email` | From Privy / registration | — |
| `stellar_public_key` | User’s Stellar account (they registered it) | Secret key, recovery phrase |
| `allowed` | Can this user enter the org? (set by super admin) | — |
| `admin_level` | user \| admin \| super_admin | — |
| `org_id` | Which org space they belong to | — |
| `wallet_activated_at` | Optional: we detected they funded the account (via Horizon) | — |

No field for: `stellar_secret`, `encrypted_secret`, `recovery_phrase`, or any key material.

---

## 5. Access control

- **Super admin**
  - Only super admin can:
    - Allowlist new users (`allowed = true`).
    - Grant (or revoke) admin status (`admin_level = admin`).
  - Only super admin (and optionally admins) can “handle payments” (e.g. create disbursements, approve payouts from org treasury).
  - Super admin is identified by a fixed list (e.g. env `SUPER_ADMIN_PRIVY_IDS`) or the first seeded user.

- **Allowlist**
  - New users register a wallet but start with `allowed = false`.
  - They cannot enter the org space (dashboard, app) until a super admin sets `allowed = true`.

- **Org space**
  - Each user is associated with an org (`org_id`). Only allowlisted users can enter that org’s space.
  - Each user has exactly one wallet (one `stellar_public_key`) for that org.

---

## 6. Payment handling

- **Who can handle payments**  
  Only super admin (and, if we allow, users with `admin_level = admin`). Normal users can view their balance and history but cannot initiate disbursements or treasury operations.

- **Where funds live**  
  User funds stay in the user’s own Stellar account. Org/treasury funds (if any) live in an org-controlled account; only super admin (and admins) can authorize movements from that treasury, but we still never hold the user’s personal keys or funds.

---

## 7. Implementation order (no key custody)

1. **DB schema (no secrets)**  
   Users table: `privy_user_id`, `email`, `stellar_public_key`, `allowed`, `admin_level`, `org_id`, timestamps. No key material.

2. **Privy login**  
   Already in place. After login, session has `privy_user_id` and email.

3. **Client: create wallet + register**  
   - New “Create wallet” or “Link wallet” flow (after first login):
     - Generate `Keypair.random()` in the browser.
     - Show secret key / backup instructions once; user saves it; we never send it.
     - User signs a registration message; client sends `stellar_public_key` + proof to backend.
   - Backend verifies signature, then inserts/updates user row with `stellar_public_key`, `allowed = false`.

4. **Backend: allowlist + admin**  
   - Super admin UI: list pending users (registered but not allowed); approve (set `allowed = true`) and optionally set `admin_level`.
   - Only super admin can access this (check `admin_level === 'super_admin'` or env allowlist).

5. **Activation UX (no custody)**  
   - Show user their Stellar address and link to Friendbot; “Fund your account to activate.” We can detect activation by querying Horizon for the account (optional `wallet_activated_at`).

6. **Resolve wallet for allowed users**  
   - `getWalletPublicKey()`: load user by session’s `privy_user_id` from DB; if user exists and `allowed`, return `stellar_public_key`; else null. Used for balance, history, and “your address” in UI.

7. **Payments**  
   - All payment actions (disburse, etc.) require `admin_level` in [super_admin, admin]. User’s own funds always stay in their wallet; we never move them with a key we hold.

---

## 8. Summary

- **Self-custodial:** Keys generated and stored only by the user; we never hold secret keys or recovery.
- **No fund custody:** User funds their own wallet (e.g. Friendbot); we never hold USDC/XLM for them.
- **We store:** Public key + allowlist + admin + org; nothing that could move the user’s funds.
- **Super admin:** Allowlist new users, grant admin; only super admin (and admins) handle payments.
- **Allowlist + org:** Only allowlisted users enter the org space; each user has one wallet (one public key).

This keeps the system fully self-custodial while still allowing org-level access control and payment handling by super admin (and admins).

---

## Document history

| Version | Date | Change |
|--------|------|--------|
| 0.1 | 2026-03-01 | Initial: self-custodial design, no keys/funds in DB, allowlist, super admin, org space. |
