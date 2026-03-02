# Improvement opportunities – solid, high-performing codebase boilerplate

Prioritized analysis of the SozuPay Dashboard codebase with concrete next steps. Use this to turn the project into a reusable, production-ready boilerplate.

---

## Already implemented (quick wins)

- **`src/lib/env.ts`** – Optional env validation: `requireEnv("Supabase")` / `requireEnv("Privy")` and `validateEnv()`. Use in a startup script or call before first use of a feature; not wired into getSupabase so build works without Supabase set.
- **`src/app/error.tsx`** – Root error boundary: logs error, shows “Something went wrong” with Try again and Go home.
- **`src/app/not-found.tsx`** – Custom 404 with links to home and dashboard.
- **`src/app/dashboard/loading.tsx`** – Dashboard segment loading skeleton while children load.
- **Tailwind** – Removed unused `./src/pages/**` from `content` (app is App Router only).
- **`server-only`** in Stellar: left as recommendation; adding `import "server-only"` to `sendUsdc.ts` can cause flaky build cache issues in some setups, so document “server-only usage” instead of enforcing there.

---

## Summary

| Priority | Area | Impact | Effort |
|----------|------|--------|--------|
| **P0** | Env validation, error/loading/not-found boundaries | Reliability, DX | Low |
| **P1** | Central API client + profile/session cache | Performance, consistency | Medium |
| **P2** | Dashboard data: server data or Suspense | Performance, UX | Medium |
| **P3** | Replace `alert()` with toast/UI feedback | UX, accessibility | Low–Medium |
| **P4** | Tests, security headers, logging | Production readiness | Medium |
| **P5** | Config and cleanup | DX, bundle | Low |

---

## P0 – Foundation (reliability and DX)

### 1. Environment variable validation

**Current:** `.env.example` documents vars; code reads `process.env.*` with ad hoc checks. Supabase/Privy throw at runtime if missing.

**Improvement:** Validate env at build/start so misconfiguration fails fast with clear errors.

- Add a small **env schema** (e.g. `src/lib/env.ts`) with Zod (or a minimal object check).
- Validate required vars for the current “mode” (e.g. `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` when using Supabase; Privy vars when `NEXT_PUBLIC_PRIVY_APP_ID` is set).
- Call validation from `next.config.ts` or from a shared server entry so dev/build fails fast.

**Files to add/change:** `src/lib/env.ts`, optionally `next.config.ts`.

---

### 2. Error and loading boundaries

**Current:** No `error.tsx`, `loading.tsx`, or `not-found.tsx`. Uncaught errors can take down a full segment; loading is per-component only.

**Improvement:**

- **`app/error.tsx`** – Root or segment error boundary: log error, show a friendly message and “Try again” / “Go home”. Prevents white screen and improves debugging.
- **`app/not-found.tsx`** – Custom 404 page (branded, link back to dashboard/home).
- **`app/loading.tsx`** (root) – Optional: global loading UI (e.g. spinner or skeleton) while route segments load.
- **`app/dashboard/loading.tsx`** – Dashboard-specific skeleton so the shell (sidebar + main) appears quickly while children load.

**Files to add:** `src/app/error.tsx`, `src/app/not-found.tsx`, `src/app/loading.tsx` (optional), `src/app/dashboard/loading.tsx`.

---

### 3. Tailwind config cleanup

**Current:** `content` includes `./src/pages/**/*` but the app is App Router–only (no `src/pages/`).

**Improvement:** Remove the `pages` path from `tailwind.config.ts` to avoid confusion and keep content paths accurate.

---

## P1 – Data layer (performance and consistency)

### 4. Central API client

**Current:** ~20+ places use raw `fetch("/api/...")` with manual `.json()`, error handling, and no shared types.

**Improvement:**

- **`src/lib/api-client.ts`** (or `api.ts`): thin wrapper around `fetch` that:
  - Handles JSON parse and non-2xx (throw or return `{ ok, data, error }`).
  - Optional: base URL, default headers, auth cookie forwarding.
- Shared **response types** for `/api/profile`, `/api/recipients`, etc., so components get typed responses.
- Optionally a small **hook** (e.g. `useApi<T>(url)`) for GET + loading/error state to reduce boilerplate.

**Impact:** Fewer duplicated try/catch and consistent error handling; easier to add retries or logging later.

---

### 5. Profile/session cache

**Current:** `/api/profile` is called from OnboardingRedirect, DashboardNav, recipients page, profile page, settings, etc. No shared cache, so repeated fetches on navigation and within the same session.

**Improvement:**

- **React context + single fetch:** One “profile provider” at dashboard (or app) level that fetches profile once and exposes `{ profile, loading, error, refetch }`. All consumers use the same data.
- Or introduce a **small client cache** (e.g. SWR or React Query) for `GET /api/profile` (and optionally other GETs) with a short stale time so navigations don’t refetch unnecessarily.

**Impact:** Fewer round trips, faster dashboard navigation, consistent profile data.

---

## P2 – Dashboard data strategy

### 6. Reduce client waterfalls on dashboard home

**Current:** Dashboard index is a server component that renders four client components; each does its own `useEffect` fetch (stats, balance, profile, transactions). Multiple independent requests after paint.

**Improvement (choose one or combine):**

- **Option A – Server data:** Make the dashboard page async; fetch stats, balance, and transactions in the server component (or in one parallel `Promise.all` in a server layout). Pass data as props to presentational client components. Only keep client for interactive bits (e.g. “Request activation”).
- **Option B – Suspense:** Keep client fetch but wrap each section in `<Suspense>` with a skeleton; use a data-fetching approach that supports Suspense (e.g. a small cache + “use” or React Query/SWR with Suspense). Improves perceived performance and isolates slow sections.

**Impact:** Faster first meaningful paint and fewer sequential requests.

---

## P3 – User feedback and accessibility

### 7. Replace `alert()` with in-app feedback

**Current:** Many flows use `alert()` for errors and success (payouts page, recipients page, SendUsdcForm, etc.). Poor UX and accessibility.

**Improvement:**

- Introduce a **toast/notification** system (e.g. a small context + component, or a lightweight library like `sonner` / `react-hot-toast`).
- Replace `alert(error)` with `toast.error(message)` and success with `toast.success(message)`.
- Keep one-off confirmations (e.g. “Are you sure?”) as modals or confirm dialogs, not `alert()`.

**Files to touch:** Payouts page, recipients page, SendUsdcForm, onboarding, and any other `alert()` call sites.

---

## P4 – Production readiness

### 8. Tests

**Current:** No test files or test runner config.

**Improvement:**

- Add **Vitest** (or Jest) + **React Testing Library** for unit and component tests.
- Start with: **env validation**, **API client** (or one route handler), and **one critical UI flow** (e.g. login redirect or payout form validation).
- Optional: **Playwright** (or Cypress) for a few e2e flows (login, add recipient, request payout).

**Files to add:** `vitest.config.ts`, `src/lib/__tests__/env.test.ts`, etc.; optionally `e2e/` and Playwright config.

---

### 9. Security headers

**Current:** No custom security headers in Next.js config or middleware.

**Improvement:**

- In **`next.config.ts`** add `headers()` returning:
  - `X-Frame-Options: DENY` (or SAMEORIGIN if you embed)
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - Optional: `Content-Security-Policy` (start with report-only or a minimal policy and tighten over time).
- Apply to all routes or to specific segments as needed.

---

### 10. Logging and request correlation

**Current:** No shared logger; debugging is ad hoc (e.g. `console.error` in catch blocks).

**Improvement:**

- **`src/lib/logger.ts`**: minimal logger (e.g. `log.info`, `log.error`) that in production can send to a service or stdout in a structured format.
- In API routes and critical paths, log errors (and optionally request id) so you can trace failures. Avoid logging secrets or full request bodies.

---

## P5 – Config and cleanup

### 11. API response shape consistency

**Current:** Most routes return `{ error: string }` on failure; some may differ. No shared middleware for CORS or error format.

**Improvement:**

- Document (or enforce) a small **API contract**: e.g. success `{ data?: T }`, error `{ error: string, code?: string }`.
- Optional: a tiny **wrapper** for route handlers that catches errors and returns the same shape and status codes.

---

### 12. Stellar SDK and server-only guarantee

**Current:** Stellar SDK is used in `lib/stellar/*` and API routes (server). Already dynamic-imported on profile client flow.

**Improvement:**

- Add **`"server-only"`** at the top of any module that imports `@stellar/stellar-sdk` and is only used on the server (e.g. `lib/stellar/sendUsdc.ts`, `lib/stellar/balance.ts`). This prevents accidental client imports and keeps the bundle clean.

---

### 13. Unused or redundant code

**Current:** `src/components/ui/demo.tsx` (indigo glow) is no longer used by the dashboard (replaced by `elegant-dark-pattern`). It’s still in the bundle if imported elsewhere.

**Improvement:** Search for imports of `demo.tsx`; if none, remove or move to a “legacy” folder. Keep `components/ui` to only actively used primitives.

---

## Suggested order of implementation

1. **Quick wins (same session):** Env validation stub, `not-found.tsx`, `error.tsx`, dashboard `loading.tsx`, Tailwind content cleanup.
2. **Next:** Central API client + typed profile response; then profile context or SWR for `/api/profile`.
3. **Then:** Replace `alert()` with toasts; add security headers.
4. **Later:** Tests (env, API, one flow); optional dashboard server data or Suspense; logging.

---

## File checklist (for boilerplate template)

When turning this into a “solid boilerplate” template, consider adding or standardizing:

- [ ] `src/lib/env.ts` – env schema and validation
- [ ] `src/app/error.tsx` – root or segment error boundary
- [ ] `src/app/not-found.tsx` – custom 404
- [ ] `src/app/loading.tsx` and/or `src/app/dashboard/loading.tsx` – loading UI
- [ ] `src/lib/api-client.ts` – central fetch + types
- [ ] Profile/session provider or SWR for `/api/profile`
- [ ] Toast/notification system and replace `alert()`
- [ ] `next.config.ts` – security headers
- [ ] `src/lib/logger.ts` – minimal logger
- [ ] Vitest (or Jest) + RTL; optional Playwright
- [ ] `server-only` in server-only Stellar modules
- [ ] Tailwind: remove `pages/` from content; document `darkMode: "class"` if used
- [ ] README section: “Architecture” and “Env vars” pointing at env validation and .env.example

This gives a single place to track improvements and a clear path to a high-performing, maintainable boilerplate.
