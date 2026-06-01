# Data Model: Admin Authentication & Session Management

**Phase 1 output** | Referenced from [plan.md](./plan.md)

No new database tables are required. The admin session is entirely represented by a signed JWT in an HTTP-only cookie, with credentials stored in environment variables.

---

## Admin Session Entity

The "Admin Session" from the spec is a stateless JWT stored in an HTTP-only cookie. There is no database record.

### JWT Payload

```json
{
  "sub": "admin",
  "iat": 1748700000,
  "exp": 1748786400
}
```

| Field | Type | Description |
|-------|------|-------------|
| `sub` | `"admin"` | Fixed subject identifying the single admin account |
| `iat` | `number` | Unix timestamp: issued-at time (set by `jose` automatically) |
| `exp` | `number` | Unix timestamp: expiry time (24 hours from `iat`, refreshed on each request) |

**Algorithm**: HS256 (HMAC-SHA256, symmetric)  
**Secret**: `JWT_SECRET` environment variable (32-byte random base64 string)

### TypeScript type

```ts
interface SessionPayload {
  sub: 'admin';
  iat: number;
  exp: number;
}
```

---

## Cookie Schema

| Property | Value |
|----------|-------|
| Name | `admin_session` |
| Value | Signed JWT string |
| `HttpOnly` | `true` — inaccessible to client-side JavaScript |
| `Secure` | `true` in production; `false` in development (HTTP localhost) |
| `SameSite` | `lax` — allows top-level navigations from external links; blocks cross-site POSTs |
| `Path` | `/` |
| `Expires` / `MaxAge` | 24 hours from now (refreshed on each authenticated request) |

---

## Environment Variables

Three new variables are required (added to `supabase/.env.example`):

| Variable | Format | Example | Notes |
|----------|--------|---------|-------|
| `ADMIN_USERNAME` | Plaintext string | `admin` | Arbitrary string; no email format required |
| `ADMIN_PASSWORD_HASH` | bcrypt hash string | `$2b$12$...` | Generated with `bcryptjs.hashSync(password, 12)`; cost factor 12 recommended |
| `JWT_SECRET` | Base64 string, ≥32 bytes | `openssl rand -base64 32` output | Used to sign and verify all admin session tokens |

### Generating `ADMIN_PASSWORD_HASH`

```bash
node -e "const b = require('bcryptjs'); console.log(b.hashSync('your-password', 12));"
```

Or use the quickstart helper script (see [quickstart.md](./quickstart.md)).

---

## Rate Limiter State (in-memory, not persisted)

The rate limiter holds ephemeral state in module-level variables. It is **not** persisted to any database.

```ts
interface RateLimitEntry {
  count: number;
  windowStart: number; // Unix timestamp (ms)
}

const ipAttempts: Map<string, RateLimitEntry> = new Map(); // per-IP counter
let globalEntry: RateLimitEntry | null = null;             // cross-IP counter
```

Two counters run in parallel:

| Counter | Limit | Purpose |
|---------|-------|---------|
| Per-IP (`ipAttempts`) | 5 attempts / 15-min window | Blocks a single IP after 5 failures |
| Global (`globalEntry`) | 25 attempts / 15-min window | Catches distributed attacks spread across many IPs |

Either counter triggering causes a 429 response. On successful login, only the per-IP entry for that IP is cleared; the global counter continues accumulating until its window expires naturally.

| Parameter | Value |
|-----------|-------|
| Window type | Fixed (resets when `now - windowStart >= WINDOW_MS`) |
| Window duration | 15 minutes |
| Per-IP max attempts | 5 |
| Global max attempts | 25 |
| Key | Client IP address (from `x-forwarded-for` header, first value) |

---

## Entities Not in This Feature's Scope

- No `users` or `admin_accounts` table (credentials are env-var-only)
- No `sessions` or `tokens` table (stateless JWT)
- No `login_attempts` table (in-memory rate limiter)
