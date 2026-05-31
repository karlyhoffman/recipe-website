# Research: Admin Authentication & Session Management

**Phase 0 output** | Referenced from [plan.md](./plan.md)

---

## Decision 1: JWT Library

**Decision**: `jose` ^6.2.3

**Rationale**: Next.js 16's own authentication guide explicitly recommends `jose` for stateless session management in App Router projects. It is pure JavaScript (no native bindings), works in both Node.js and Proxy (which uses the Node.js runtime in Next.js 16), and supports HS256 signing/verification via `SignJWT` / `jwtVerify`. It is already the de facto standard for custom JWT in Next.js projects.

**Alternatives considered**:
- `jsonwebtoken` — Node.js-only, requires native bindings, not recommended for App Router. Rejected.
- Manual HMAC — More implementation surface area for no benefit. Rejected.

---

## Decision 2: Password Hashing Library

**Decision**: `bcryptjs` ^3.0.3 (with `@types/bcryptjs`)

**Rationale**: `bcryptjs` is a pure JavaScript implementation of bcrypt — no native bindings, works on any platform including Vercel without additional build configuration. The spec explicitly permits bcrypt. At login time (a Route Handler, not Proxy), native module support is available, so `argon2` would also work; however, `bcryptjs` requires no additional build steps and produces standard bcrypt hashes that any future migration could consume. Sufficient security for a single-admin personal site.

**Alternatives considered**:
- `argon2` — Requires native Node.js bindings; build can fail on Vercel's sandboxed environment without explicit configuration. Rejected for simplicity.
- `bcrypt` (native) — Same issue: native bindings, no advantage over `bcryptjs` for this use case. Rejected.

---

## Decision 3: Rate Limiting Approach

**Decision**: In-memory `Map`-based rate limiter in `lib/rate-limiter.ts`

**Rationale**: The spec calls for "simple server-side rate limiting." For a single-admin personal recipe website with negligible traffic, an in-memory rate limiter is sufficient. It requires no additional dependencies or infrastructure. The known limitation — that the attempt counter resets on a serverless cold start — is acceptable at this scale: an attacker would need to trigger a cold start between every 5 attempts, and the site has essentially one legitimate user.

**Known limitation**: Rate limit state does not persist across serverless function warm instances or cold starts. This is documented and acknowledged.

**Design**: `Map<string, { count: number; windowStart: number }>` keyed by IP address. Window type: fixed window (reset count when `Date.now() - windowStart >= 15 minutes`). 5 attempts per IP per 15-minute window. Successful login clears the entry for that IP.

**Alternatives considered**:
- Supabase table for attempt tracking — Adds DB dependency for a simple feature. Rejected.
- Upstash Redis / Vercel KV — External infrastructure for a personal site. Rejected.
- Sliding window — Marginally more accurate but meaningfully more complex for no practical benefit at this scale. Rejected.

---

## Decision 4: Session Expiry Strategy

**Decision**: Sliding window via proxy-side cookie refresh

**Rationale**: The spec (FR-009) requires "24 hours of inactivity." With a stateless JWT, the only way to implement a sliding window is to issue a new JWT with a fresh 24-hour expiry on each authenticated request. The proxy (`proxy.ts`) runs on every non-static request, making it the right place for this refresh. This matches the pattern shown in the Next.js 16 auth guide ("Updating or refreshing sessions").

**Implementation**: On each authenticated request through `proxy.ts`, if the current JWT is valid and has more than 0 seconds remaining, issue a new JWT with `exp = now + 24h` and set it as the cookie. The response carries the refreshed cookie transparently.

**JWT algorithm**: HS256 (symmetric HMAC-SHA256). Sufficient for a single-server application where the signing and verification key are both on the server. The key is a random 32-byte base64 secret stored in `JWT_SECRET`.

**Alternatives considered**:
- Fixed 24h JWT — Does not implement "inactivity" expiry; session expires 24h after login regardless of activity. Rejected.
- Server-side session store — Adds stateful infrastructure (DB or Redis). Rejected (spec: "stateless, signed with a secret, no server store needed").

---

## Decision 5: Proxy Integration

**Decision**: Modify `proxy.ts` (the existing file); do not create `middleware.ts`

**Rationale**: In Next.js 16, the proxy convention uses `proxy.ts` at the project root (Middleware was renamed to Proxy in Next.js 16). The project already has a `proxy.ts` stub that implements Supabase auth. We replace the Supabase auth logic with JWT validation. The `x-user-authenticated` header injection (already consumed by `Navbar.tsx`) is preserved.

**Gated routes**:
- `/import` — protected page
- `/api/import/extract` and `/api/import/save` — protected API routes called from the import page

**Auth API exclusions**: `/api/auth/login` and `/api/auth/logout` are excluded from protection (must be publicly accessible for the login flow to function).

**returnUrl handling**: When redirecting an unauthenticated user to `/login`, the original path is appended as `?returnUrl=<path>`. On successful login, the server validates `returnUrl` before redirecting: it must be a relative path starting with `/`, not starting with `//`, and not containing `://`. Invalid or absent `returnUrl` falls back to `/import`.

---

## Decision 6: Logout Mechanism

**Decision**: HTML form POST to `/api/auth/logout`; cookie deletion server-side

**Rationale**: Stateless JWTs cannot be server-side invalidated. Logout is implemented by deleting the `admin_session` cookie via the Route Handler's `Set-Cookie` response header. The client immediately loses the token. The Next.js docs confirm: `cookieStore.delete('session')` in a Route Handler or Server Action is the standard approach.

The logout control in `Navbar.tsx` will be a `<form method="POST" action="/api/auth/logout">` with a submit button. This approach works without JavaScript and follows HTML semantics.

**Known limitation documented in spec (CHK010)**: A valid JWT remains technically valid until its `exp` timestamp even after logout (cookie deletion). Since the JWT has a 24-hour TTL and there is no token blacklist, a stolen token (extracted before logout) would remain valid for up to 24h. For a single-admin personal recipe site, this risk is accepted.
