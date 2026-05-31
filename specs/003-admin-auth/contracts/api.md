# API Contracts: Admin Authentication

**Phase 1 output** | Referenced from [plan.md](../plan.md)

---

## POST /api/auth/login

Validates admin credentials, enforces rate limiting, and sets the session cookie on success.

### Request

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "username": "admin",
  "password": "plaintext-password"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `username` | `string` | Yes | Non-empty |
| `password` | `string` | Yes | Non-empty |

### Response: Success (200)

```http
HTTP/1.1 200 OK
Set-Cookie: admin_session=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=<24h from now>
Content-Type: application/json
```

```json
{
  "ok": true,
  "redirectTo": "/import"
}
```

`redirectTo` is the validated `returnUrl` from the request body (if present and valid), otherwise `/import`.

### Response: Invalid Credentials (401)

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json
```

```json
{
  "error": "Invalid username or password."
}
```

The error message does not indicate which field was incorrect (FR-003).

### Response: Rate Limited (429)

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
```

```json
{
  "error": "Too many failed login attempts. Please try again in 15 minutes."
}
```

Returned when the client IP has exceeded 5 consecutive failed login attempts within the current 15-minute window (FR-013).

### Response: Missing Fields (400)

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
```

```json
{
  "error": "Username and password are required."
}
```

### Response: Server Error (500)

```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json
```

```json
{
  "error": "Something went wrong, please try again."
}
```

### Request Body: Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `returnUrl` | `string` (optional) | Post-login redirect target. Must be a relative path (`/`-prefixed, no `://`, no `//` prefix). Invalid values are silently ignored; fallback is `/import`. |

---

## POST /api/auth/logout

Clears the admin session cookie and redirects to the login page.

### Request

```http
POST /api/auth/logout
```

No body required. Typically submitted via an HTML form from the authenticated UI.

### Response: Success (302)

```http
HTTP/1.1 302 Found
Set-Cookie: admin_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
Location: /login
```

The session cookie is deleted by setting it to an empty value with a past expiry. The client is redirected to `/login`.

### Response: No Active Session (302)

If no valid session cookie is present, the endpoint still responds with a redirect to `/login`. It does not return an error — idempotent logout is safe.

---

## Proxy Behaviour (proxy.ts)

Not an API endpoint, but documented here for completeness.

| Condition | Action |
|-----------|--------|
| Request to `/import` or `/api/import/**`, no valid JWT cookie | Redirect to `/login?returnUrl=<original-path>` |
| Request to `/login`, valid JWT cookie | Redirect to `/import` |
| Request to `/api/auth/**` | Pass through (no auth check) |
| Authenticated request (any route) | Refresh JWT cookie expiry by 24h; set `x-user-authenticated: true` header |
| Unauthenticated request (any route) | Set `x-user-authenticated: false` header; no redirect (unless protected route) |
