# Performance analysis and React/Next.js best practices

Summary of findings and changes from a full analysis (Next.js 15, React 19, Turbopack).

---

## Build fixes applied

- **`keypair.secretKey`** → **`keypair.secret()`** in `api/auth/unlock-wallet/route.ts` (Stellar SDK API).
- **`sendUsdc.ts`**: use **`keypair.publicKey()`** directly (no cast).
- **Payouts route**: **`normalized.some((n) => n != null && n.type === "to_stellar")`** for strict null check.
- **Recipients page & OnboardingRedirect**: typed API response `(p: { admin_level?: string })` / `(p: { needsPayoutWalletSetup?: boolean })` to fix `Property does not exist on type '{}'`.

---

## Bundle size (from `npm run build`)

| Route | Page size | First Load JS | Note |
|-------|-----------|---------------|------|
| `/` | 630 B | **261 kB** | Home + Privy in layout |
| `/login` | 1.34 kB | **262 kB** | Privy + login UI |
| `/dashboard` | 2.37 kB | 106 kB | Dashboard shell |
| **/dashboard/profile** | **256 kB** → **3.14 kB** | **425 kB** → **173 kB** | Stellar SDK now dynamic-imported |
| /dashboard/settings | 2.63 kB | 164 kB | Privy + BankAccountsSection |
| /dashboard/payouts | 3.38 kB | 111 kB | SendUsdcForm |
| /dashboard/recipients | 3.1 kB | 107 kB | Recipients UI |
| Shared (all pages) | — | **104 kB** | React, Next, shared chunks |
| **Middleware** | — | **34.3 kB** | Auth + redirects |

Main takeaway: **Profile** was the heaviest page because it imported **`@stellar/stellar-sdk`** (Keypair) on the client. That import is now **dynamic** (loaded only when the user clicks “Create wallet” or “Confirm backup”), so the profile route no longer ships the full Stellar SDK in the initial bundle.

---

## Changes made for performance

1. **Dynamic import of Stellar SDK on Profile**
   - **Before:** `import { Keypair } from "@stellar/stellar-sdk"` at top of `dashboard/profile/page.tsx` → entire SDK in profile bundle.
   - **After:** `const { Keypair } = await import("@stellar/stellar-sdk")` inside `handleCreateWallet` and `handleConfirmBackupAndRegister`. SDK loads only when the user runs the “create wallet” flow.
   - Aligns with Next best practice: [Bundling – client-only heavy libs](https://nextjs.org/docs/app/guides/package-bundling) (dynamic import instead of top-level for large, optional client code).

2. **Lockfile / tracing warning**
   - **Next warning:** “We detected multiple lockfiles… pnpm-lock.yaml … package-lock.json”.
   - **Option A:** Set `outputFileTracingRoot` in `next.config.ts` to the project directory (done) so tracing is explicit.
   - **Option B:** Remove the lockfile you don’t use (e.g. delete `pnpm-lock.yaml` if you only use npm) to silence the warning and avoid confusion.

3. **Unused UI components (removed)**
   - **Deleted** `src/components/ui/background-snippets.tsx` and `src/components/ui/background-components.tsx` (they were never imported). Only **`demo.tsx`** (indigo glow) is used in the dashboard layout.

4. **Lazy Privy load (no UX change)**
   - **Root layout** now uses **`LazyPrivyWrapper`**: children render immediately; Privy is loaded via `import()` after mount. First paint no longer waits for the Privy bundle; login and auth behave the same once the script loads.

5. **Dashboard background**
   - Dashboard uses **`DarkGradientBg`** (`elegant-dark-pattern.tsx`) with class-based dark mode (`darkMode: "class"`) so nav and content stay readable. **`demo.tsx`** (indigo glow) remains in `components/ui` for reuse elsewhere if needed.

---

## React / Next best practices checked

- **Data fetching**
  - Dashboard and many pages use client-side `fetch("/api/...")` in `useEffect`. For read-only data that could be done in Server Components and passed as props to reduce client JS and improve TTFB; current pattern is acceptable for an API-first dashboard.
  - No obvious **waterfalls** in the API routes we saw; batch payouts normalize in one pass then loop.

- **Client boundary**
  - **Privy** and **Stellar SDK** (when used on client) are correctly used only in Client Components or behind dynamic import. No server-incompatible packages in Server Components.

- **Bundling**
  - No redundant polyfills; no custom webpack in use (Turbopack-friendly).
  - Heavy, optional client-only usage (Stellar Keypair on profile) is now loaded via **dynamic import**.

- **Images / assets**
  - No `next/image` or large static assets noted in the analyzed routes; add image optimization when you add images.

---

## Optional next steps

1. **Unused background components**  
   Already removed (see above).

2. **Bundle analyzer (Next 16.1+)**  
   When you upgrade, you can run:
   ```bash
   next experimental-analyze
   ```
   to inspect bundle size and import chains per route. Until then, use `npm run build` and check the “First Load JS” table in the output.

3. **Privy load**  
   **Done:** `LazyPrivyWrapper` loads `PrivyProviderWrapper` after mount so the initial HTML doesn’t wait on the Privy bundle. For even smaller initial JS on public pages, you could scope `PrivyProvider` to a route group that includes only `/login` and `/dashboard` (larger refactor).

4. **Server Components for reads**  
   Where possible, move “load once on page open” data to Server Components and pass as props to Client Components to reduce client-side fetch and JS.

---

## Skill reference

- **Next.js best practices** (Cursor skill): `next-best-practices` – file conventions, RSC boundaries, data patterns, async APIs, bundling, image/font optimization.
- **Vercel React best practices**: `npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices` (install when needed; may prompt for agent selection).
