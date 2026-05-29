# Quickstart: Migrate Recipe Backend from Prismic to Supabase

**Feature**: `001-prismic-to-supabase` | **Date**: 2026-05-27

---

## Prerequisites

- Access to the Prismic repository (API URL + access token from the 2023 site's `.env`)
- A Supabase project created (free tier is sufficient)
- Node.js 20+ installed

---

## Step 1: Install Supabase client

```bash
cd supabase
pnpm add @supabase/ssr
```

---

## Step 2: Set environment variables

Create `supabase/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

Both values are found in the Supabase dashboard under **Project Settings → API**. The URL uses `NEXT_PUBLIC_` (safe to expose). The anon key must **not** — `SUPABASE_ANON_KEY` keeps it server-only and out of the client JS bundle.

Also add both variables to **Vercel** (Project Settings → Environment Variables) before deploying the 2026 site. A production build without them will fail when the Supabase client is instantiated.

---

## Step 3: Apply the database schema

Run the migration SQL against your Supabase project (via the Supabase SQL editor or CLI):

```sql
-- See specs/001-prismic-to-supabase/data-model.md for full table definitions
-- Key tables: recipes, tags, recipe_tags, ingredient_entries,
--             instruction_entries, related_recipes, cook_next_list, favorites_list
```

The full DDL will live in `supabase/supabase/migrations/`.

---

## Step 4: Run the migration script

The migration script reads all content from Prismic and writes it to Supabase.

```bash
# From repo root — requires Prismic env vars from the 2023 site
PRISMIC_API_URL=... PRISMIC_ACCESS_TOKEN=... npx tsx supabase/scripts/migrate-from-prismic.ts
```

The script:
1. Fetches all tags (ingredient, cuisine, type, season) from Prismic
2. Inserts them into the `tags` table
3. Fetches all recipes with related data
4. Inserts recipes, ingredient entries, instruction entries, tag associations, and related recipe links
5. Fetches the cook-next and favorites lists and inserts them in order
6. Prints a count summary at the end for verification

---

## Step 5: Verify the migration

```bash
# Confirm counts match Prismic
# Check: recipe count, tag counts per category, cook-next list length
```

Spot-check 3-5 recipes by visiting them in the running dev server:

```bash
cd supabase && pnpm dev
# Visit http://localhost:3000/recipes/{some-slug}
```

---

## Step 6: Wire up the data access layer

Replace the placeholder implementations in `supabase/lib/data.ts` with Supabase queries as documented in `contracts/data-access.md`.

Create `supabase/lib/supabase.ts` with the client factory:

```typescript
import { createServerClient } from '@supabase/ssr'

export function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [] } }
  )
}
```

---

## Step 7: Remove placeholder data and Prismic dependencies

Once all pages are confirmed working with Supabase data:

```bash
cd supabase
rm lib/placeholder-data.ts
pnpm remove @prismicio/client @prismicio/helpers @prismicio/next @prismicio/react
```

Confirm the build still passes: `pnpm build`

---

## Rollback

The 2023 site remains untouched throughout this migration. If something goes wrong, the 2026 site can revert to placeholder data by reverting `lib/data.ts` to its pre-migration state. No production traffic is affected until the 2026 site is deliberately deployed to replace the 2023 site.
