# Implementation Plan: Admin Authentication & Session Management

**Branch**: `specs/003-admin-auth` | **Date**: 2026-05-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-admin-auth/spec.md`

## Summary

Replace the existing Supabase-based auth stub in `proxy.ts` with a complete custom JWT authentication system. The admin logs in via a new `/login` page; credentials are validated against environment-variable-stored values (plaintext username + bcrypt-hashed password). On success, a signed HTTP-only JWT cookie is set. The proxy validates the JWT on every request, gates `/import` and related API routes, injects the `x-user-authenticated` header (already consumed by Navbar), and refreshes the cookie expiry on each authenticated request to implement sliding-window inactivity expiry.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 16.2.6 (App Router), React 19

**Primary Dependencies**:
- Existing: `@supabase/ssr`, `classnames`, Next.js, React
- New: `jose` ^6.2.3 (JWT sign/verify — recommended by Next.js 16 auth guide), `bcryptjs` ^3.0.3 + `@types/bcryptjs` (bcrypt password hash comparison, pure JS — no native bindings)

**Storage**: No new database tables. Auth state lives entirely in the JWT cookie + environment variables.

**Testing**: ESLint only (no test framework in project)

**Target Platform**: Next.js 16 App Router (proxy.ts + Route Handlers + Server Components), Vercel deployment

**Performance Goals**: Login response under 1 second (SC-004). Proxy JWT verification adds ~1ms per request (jose is synchronous for HS256 verification).

**Constraints**: Stateless JWT (no server-side session store). Rate limiter is in-memory (resets on cold starts — acceptable for a single-admin personal site with low traffic).

**Scale/Scope**: Single-admin personal recipe website. No concurrency concerns.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| 1. User-Centered Content | ✅ Pass | Auth gates admin tools only; public recipe browsing is fully unaffected. |
| 2. Maintainable Frontend Architecture | ✅ Pass | `LoginForm` mirrors `PdfImportForm` in structure. `proxy.ts` replaces its Supabase stub with JWT logic — same file, same pattern. One new `lib/` file per concern. |
| 3. Data Integrity & Content Reliability | ✅ Pass | Credentials stored only in env vars, never in code. bcrypt comparison prevents password leakage. JWT secret is rotatable. |
| 4. Quality through Documentation & Review | ✅ Pass | Plan, contracts, data model, and quickstart documented. PR must update `.env.example` and document removal of dev-only Supabase auth bypasses. |
| 5. Performance and Reliability | ✅ Pass | Proxy JWT check is O(1), no DB calls. bcrypt comparison only on login. |
| 6. Incremental Delivery & Observability | ✅ Pass | Phases are independently verifiable: session lib → proxy → login UI → logout. |
| 7. Codebase Consistency & Pattern Adherence | ✅ Pass | Reviewed `PdfImportForm`, `proxy.ts`, `Navbar.tsx`, and `form.module.scss` before designing. New code mirrors established patterns. |

**Justified deviations from defaults:**
- Two new dependencies (`jose`, `bcryptjs`) are unavoidable — no built-in Next.js or browser API handles JWT signing or bcrypt comparison. Must be noted in the PR description per the constitution.
- Three new environment variables (`ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `JWT_SECRET`) added to `.env.example`. Existing Supabase auth bypasses in import route handlers are removed.

## Project Structure

### Documentation (this feature)

```text
specs/003-admin-auth/
├── plan.md              # This file
├── research.md          # Phase 0 decisions
├── data-model.md        # Phase 1 session entity + environment variable schema
├── quickstart.md        # Phase 1 setup guide (env vars, hash generation, local test)
├── contracts/
│   └── api.md           # Phase 1 auth API contracts (login, logout)
└── tasks.md             # Phase 2 output (created by /speckit-tasks)
```

### Source Code Changes (in `supabase/`)

**New files:**

```text
supabase/
├── lib/
│   ├── session.ts                      # JWT sign/verify, cookie options, sliding-window refresh
│   └── rate-limiter.ts                 # In-memory IP rate limiter (5 attempts / 15-min window)
├── app/
│   └── (site)/
│       └── login/
│           └── page.tsx                # Login page (Server Component shell)
│       └── api/
│           └── auth/
│               ├── login/
│               │   └── route.ts        # POST /api/auth/login
│               └── logout/
│                   └── route.ts        # POST /api/auth/logout
├── components/
│   └── LoginForm.tsx                   # Login form (Client Component; mirrors PdfImportForm)
└── styles/
    └── pages/
        └── login.module.scss           # Login page styles
```

**Existing files to modify:**

```text
supabase/
├── proxy.ts                            # Replace Supabase auth with JWT validation + sliding refresh
├── components/Navbar.tsx               # Add logout form when authenticated
├── app/api/import/extract/route.ts     # Remove Supabase auth check (proxy handles it)
├── app/api/import/save/route.ts        # Remove Supabase auth check (proxy handles it)
└── .env.example                        # Add ADMIN_USERNAME, ADMIN_PASSWORD_HASH, JWT_SECRET
```

**Structure Decision**: Extends the existing web application structure (`proxy.ts` for route protection, `lib/` for utilities, `components/` for UI, `styles/pages/` for page-scoped styles, `app/(site)/` for pages, `app/api/` for route handlers). No new top-level directories.

## Phase Artifacts

- **research.md** — [JWT library, password hashing, rate limiting, session strategy decisions](./research.md)
- **data-model.md** — [JWT payload structure, cookie options, environment variable schema](./data-model.md)
- **contracts/api.md** — [POST /api/auth/login and POST /api/auth/logout contracts](./contracts/api.md)
- **quickstart.md** — [Env var setup, bcrypt hash generation, local test instructions](./quickstart.md)
