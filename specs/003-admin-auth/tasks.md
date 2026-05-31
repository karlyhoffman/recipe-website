---

description: "Task list for Admin Authentication & Session Management"
---

# Tasks: Admin Authentication & Session Management

**Input**: Design documents from `specs/003-admin-auth/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: No test framework in project (ESLint only). No test tasks generated.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Paths are relative to `supabase/` (the active Next.js project)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install new dependencies and document environment variable requirements.

- [ ] T001 Install `jose` and `bcryptjs` dependencies: `npm install jose bcryptjs && npm install --save-dev @types/bcryptjs` from `supabase/`
- [ ] T002 [P] Add `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, and `JWT_SECRET` to `supabase/.env.example` with generation instructions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core session utilities that every route handler and the proxy depend on. Must be complete before any user story work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T003 Create `supabase/lib/session.ts`: `SessionPayload` interface (`sub: 'admin'`, `iat`, `exp`); `signToken(payload)` using `jose` `SignJWT` with HS256 and 24h expiry; `verifyToken(token)` using `jose` `jwtVerify`; `getCookieOptions()` returning `{ httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: new Date(Date.now() + 24 * 60 * 60 * 1000) }`
- [ ] T004 [P] Create `supabase/lib/rate-limiter.ts`: `RateLimitEntry` interface (`count: number`, `windowStart: number`); module-level `Map<string, RateLimitEntry>`; `isRateLimited(ip: string): boolean` (5 attempts / 15-min fixed window); `recordFailedAttempt(ip: string): void`; `clearAttempts(ip: string): void`

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 — Admin Login (Priority: P1) 🎯 MVP

**Goal**: Admin navigates to `/login`, enters credentials, and gains access to gated areas. Invalid credentials produce a clear error message. Empty-field submissions show inline validation without a server round-trip.

**Independent Test**: Visit `/login`, submit valid credentials (matching `.env.local` values) → redirected to `/import`. Submit invalid credentials → error message displayed on form. Submit with empty field → inline validation error shown before any fetch occurs.

- [ ] T005 [P] [US1] Create `supabase/app/api/auth/login/route.ts`: `POST` handler; validate `username` and `password` are non-empty (400 if missing); check `isRateLimited(ip)` from `x-forwarded-for` (429 if limited); compare `username` against `ADMIN_USERNAME` env var and `password` against `ADMIN_PASSWORD_HASH` using `bcryptjs.compare` (401 on mismatch, with `recordFailedAttempt`); on success call `clearAttempts`, `signToken`, set `admin_session` cookie via `cookies().set`, validate `returnUrl` (relative path, no `://`, no `//` prefix), return `{ ok: true, redirectTo }` (200); catch-all returns 500 with `"Something went wrong, please try again."`
- [ ] T006 [P] [US1] Create `supabase/styles/pages/login.module.scss`: page layout styles centering the login card; form field styles consistent with existing `form.module.scss` patterns; error message styles; submit button styles
- [ ] T007 [US1] Create `supabase/components/LoginForm.tsx`: Client Component (`'use client'`); controlled `username` and `password` inputs; client-side empty-field validation (inline errors, no fetch) satisfying SC-007; `fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({username, password, returnUrl}) })`; display API error message on non-2xx; `router.push(redirectTo)` on success; display session-expiry message ("Your session has expired. Please log in again.") when `expired` prop is `true`; WCAG 2.1 AA: visible `<label>` elements, keyboard navigable, focus management on error (FR-012)
- [ ] T008 [US1] Create `supabase/app/(site)/login/page.tsx`: Server Component; read `expired` and `returnUrl` from `searchParams`; render `<LoginForm expired={!!expired} returnUrl={returnUrl} />`; include `<title>` and page heading

**Checkpoint**: US1 fully functional. Admin can log in, see errors, and be redirected. Validate independently before US2.

---

## Phase 4: User Story 2 — Gated Content Protection (Priority: P2)

**Goal**: Unauthenticated users are redirected to `/login` when they attempt to reach any gated page or API route. The Navbar hides the Import link for unauthenticated users and shows it for authenticated users.

**Independent Test**: While unauthenticated, visit `/import` → redirected to `/login?returnUrl=/import`. While unauthenticated, visit `/api/import/extract` → redirected to `/login`. Navbar: no Import link when unauthenticated; Import link visible when authenticated.

- [ ] T009 [US2] Modify `supabase/proxy.ts`: import `verifyToken` from `lib/session.ts`; remove Supabase `createServerClient` / `auth.getUser()` logic; attempt `verifyToken` from `admin_session` cookie; on protected routes (`/import`, `/api/import/**`): redirect unauthenticated requests to `/login?returnUrl=<original-path>`; on `/login`: redirect authenticated requests to `/import`; on all requests: set `x-user-authenticated: 'true'` or `'false'` header; on authenticated requests: refresh the `admin_session` cookie with a new 24h expiry (sliding window); on expired-JWT redirects from protected routes: use `/login?returnUrl=<path>&expired=1`; pass `/api/auth/**` through without auth check
- [ ] T010 [P] [US2] Modify `supabase/app/api/import/extract/route.ts`: remove the Supabase auth check (`supabase.auth.getUser()` block and the `if (!isDev)` guard) — the proxy now enforces authentication for this route
- [ ] T011 [P] [US2] Modify `supabase/app/api/import/save/route.ts`: remove the Supabase auth check — the proxy now enforces authentication for this route

**Checkpoint**: US2 fully functional. All gated routes blocked for unauthenticated users. Navbar correctly hides/shows Import link. Validate independently before US3.

---

## Phase 5: User Story 3 — Session Persistence & Expiration (Priority: P3)

**Goal**: The admin's session persists across browser refreshes for up to 24 hours of inactivity. When a session has expired, the admin is redirected to `/login` with a visible expiry notification.

**Independent Test**: Log in, refresh the page → still authenticated (cookie refreshed by proxy). Manually delete the `admin_session` cookie, navigate to `/import` → redirected to `/login` (no expiry message, just unauthenticated). To test expiry notification: log in, manually edit the cookie to an expired JWT, navigate to a protected page → redirected to `/login?expired=1` and expiry message is shown.

- [ ] T012 [US3] Modify `supabase/components/LoginForm.tsx`: ensure the `expired` prop (already accepted in T007) renders the session-expiry message — verify it's displayed correctly and accessible (role="alert" or equivalent); confirm `?expired=1` in URL triggers the message end-to-end from T009's redirect
- [ ] T013 [US3] Modify `supabase/app/(site)/login/page.tsx`: verify `searchParams.expired` is read and passed to `<LoginForm expired={searchParams.expired === '1'} />` — confirm the prop plumbing from proxy redirect through to the UI message

**Checkpoint**: US3 fully functional. Session persists across refreshes. Expiry notification appears on `/login` after an expired JWT redirect.

---

## Phase 6: User Story 4 — Logout (Priority: P4)

**Goal**: The authenticated admin sees a logout control in the Navbar. Clicking it immediately ends the session and redirects to `/login`. After logout, all gated pages are inaccessible.

**Independent Test**: While authenticated, confirm a logout button is visible in the Navbar. Click logout → redirected to `/login`, `admin_session` cookie is cleared. Navigate to `/import` → redirected to `/login`. Browser back button to `/import` → still redirected to `/login`.

- [ ] T014 [US4] Create `supabase/app/api/auth/logout/route.ts`: `POST` handler; delete the `admin_session` cookie by calling `cookies().set('admin_session', '', { ...getCookieOptions(), expires: new Date(0), maxAge: 0 })`; return `NextResponse.redirect('/login')` (302); idempotent — no error if cookie is absent
- [ ] T015 [US4] Modify `supabase/components/Navbar.tsx`: import and conditionally render a logout form: `<form method="POST" action="/api/auth/logout"><button type="submit">Logout</button></form>` when `x-user-authenticated` header is `'true'`; style consistently with existing nav items; accessible (button with visible label)

**Checkpoint**: US4 fully functional. Logout ends session, clears cookie, redirects to login. All four user stories now complete.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, lint pass, and quickstart verification.

- [ ] T016 [P] Run ESLint on all new and modified files: `supabase/lib/session.ts`, `supabase/lib/rate-limiter.ts`, `supabase/app/api/auth/login/route.ts`, `supabase/app/api/auth/logout/route.ts`, `supabase/app/(site)/login/page.tsx`, `supabase/components/LoginForm.tsx`, `supabase/components/Navbar.tsx`, `supabase/proxy.ts`, `supabase/app/api/import/extract/route.ts`, `supabase/app/api/import/save/route.ts` — resolve all warnings and errors
- [ ] T017 [P] Validate the full quickstart.md flow end-to-end: install deps (T001), generate bcrypt hash, generate JWT secret, set `.env.local`, run `npm run dev`, test login flow (valid creds → /import), test session expiry (delete cookie → redirect), test rate limiting (5 bad passwords → rate-limit error on 6th attempt)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T001 (deps installed) — **blocks all user stories**
- **US1 (Phase 3)**: Depends on T003 (session.ts) and T004 (rate-limiter.ts)
- **US2 (Phase 4)**: Depends on T003 (session.ts for verifyToken in proxy)
- **US3 (Phase 5)**: Depends on T007 (LoginForm), T008 (login page), T009 (proxy expired redirect)
- **US4 (Phase 6)**: Depends on T003 (getCookieOptions in logout route)
- **Polish (Phase 7)**: Depends on all implementation phases

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — no dependency on other stories
- **US2 (P2)**: Can start after Foundational — no dependency on US1 (proxy runs independently of login page)
- **US3 (P3)**: Depends on US1 (LoginForm expiry message) and US2 (proxy expired redirect)
- **US4 (P4)**: Can start after Foundational — no dependency on US1 or US2

### Within Each User Story

- T005 and T006 are parallel (different files)
- T007 depends on T005 (POSTs to the login route) and T006 (imports styles)
- T008 depends on T007 (renders LoginForm)
- T010 and T011 are parallel (different files), both independent of T009 order-wise but T009 must be working for the full flow
- T012 and T013 are a small paired change; T013 is trivial if T012 is done

### Parallel Opportunities

- T001 and T002 (Phase 1) can run in parallel
- T003 and T004 (Phase 2) can run in parallel
- T005 and T006 (Phase 3) can run in parallel
- T010 and T011 (Phase 4) can run in parallel
- T016 and T017 (Phase 7) can run in parallel
- US1 (Phase 3) and US2 (Phase 4) and US4 (Phase 6) can run in parallel once Foundational is done

---

## Parallel Example: US1

```bash
# These two tasks have no inter-dependency — run together:
Task T005: Create supabase/app/api/auth/login/route.ts
Task T006: Create supabase/styles/pages/login.module.scss

# Then, once T005 and T006 are done:
Task T007: Create supabase/components/LoginForm.tsx

# Then, once T007 is done:
Task T008: Create supabase/app/(site)/login/page.tsx
```

## Parallel Example: US2

```bash
# T009 is the main change; T010 and T011 are independent removals:
Task T009: Modify supabase/proxy.ts

# In parallel (different files, no inter-dependency):
Task T010: Modify supabase/app/api/import/extract/route.ts
Task T011: Modify supabase/app/api/import/save/route.ts
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (blocks everything)
3. Complete Phase 3: US1 (login page + route)
4. Complete Phase 4: US2 (proxy gating + route cleanup)
5. **STOP and VALIDATE**: Login, access import, log in with wrong creds, visit import unauthenticated
6. Ship this as the working auth system

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Admin can log in (MVP)
3. US2 → Routes are gated; Navbar hides/shows correctly
4. US3 → Session expiry notification works end-to-end
5. US4 → Logout control complete
6. Polish → ESLint clean, quickstart validated

---

## Notes

- [P] tasks = different files, no shared state dependencies
- [Story] label maps each task to a user story for traceability
- No test tasks: project uses ESLint only (no jest/vitest)
- `supabase/` is the root for all source paths in this feature
- T003 (`session.ts`) is the single source of truth for JWT logic — proxy, login route, and logout route all import from it
- Rate limiter state resets on cold starts (documented limitation; acceptable for single-admin personal site)
- T009 (proxy.ts) is the highest-risk task: it removes Supabase auth and replaces it with JWT — test this in isolation before declaring US2 complete
