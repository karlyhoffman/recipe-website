# Quickstart: Admin Authentication & Session Management

**Phase 1 output** | Referenced from [plan.md](./plan.md)

---

## Prerequisites

- Node.js 20+ installed
- The `supabase/` project dependencies installed (`npm install` from `supabase/`)
- A `.env.local` file in `supabase/` (copy from `.env.example`)

---

## Step 1: Install New Dependencies

From the `supabase/` directory:

```bash
npm install jose bcryptjs
npm install --save-dev @types/bcryptjs
```

---

## Step 2: Set Environment Variables

Add the following to `supabase/.env.local`:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=<bcrypt-hash>
JWT_SECRET=<base64-secret>
```

### Generate `ADMIN_PASSWORD_HASH`

Run from the `supabase/` directory (after installing `bcryptjs`):

```bash
node -e "const b = require('bcryptjs'); console.log(b.hashSync('your-chosen-password', 12));"
```

Copy the output (a `$2b$12$...` string) into `.env.local` as `ADMIN_PASSWORD_HASH`.

### Generate `JWT_SECRET`

```bash
openssl rand -base64 32
```

Copy the output into `.env.local` as `JWT_SECRET`.

---

## Step 3: Run the Development Server

```bash
cd supabase
npm run dev
```

---

## Step 4: Test the Login Flow

1. Open `http://localhost:3000/login`
2. Submit valid credentials (matching `ADMIN_USERNAME` + the password you hashed)
3. Confirm redirect to `/import`
4. Confirm the Import link appears in the navbar
5. Visit `http://localhost:3000/import` directly while unauthenticated (in a private window) — confirm redirect to `/login`

### Test Session Expiry (manual)

1. Log in successfully
2. Open browser DevTools → Application → Cookies → `admin_session`
3. Delete the cookie manually
4. Attempt to navigate to `/import` — confirm redirect to `/login?returnUrl=/import`

### Test Rate Limiting

1. Submit 5 incorrect passwords in a row
2. On the 6th attempt, confirm the form displays the rate-limit error message
3. The error should appear without a server round-trip reset (lockout persists in the same process)

---

## Environment Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `ADMIN_USERNAME` | Yes | Plaintext admin username (arbitrary string) |
| `ADMIN_PASSWORD_HASH` | Yes | bcrypt hash of the admin password (cost factor 12 recommended) |
| `JWT_SECRET` | Yes | 32-byte base64 string used to sign and verify JWT tokens |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (existing) |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon key (existing) |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for recipe extraction (existing) |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Supabase service role key (existing; only used for data writes) |
