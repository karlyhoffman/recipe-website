# Quickstart: Cheapest Grocery Store

**Phase 1 output** | Referenced from [plan.md](./plan.md)

---

## Prerequisites

- The `supabase/` project is running locally (`npm run dev` from `supabase/`)
- Supabase project is accessible (local or remote)
- The migration `0009_grocery_store_prices.sql` has been applied

---

## Step 1: Apply the Migration

From the `supabase/` directory, apply the new migration using the Supabase MCP or CLI:

```bash
# Via Supabase CLI (if configured)
supabase db push

# Or apply the SQL directly in Supabase Studio → SQL Editor
```

The migration creates the `stores` and `ingredient_prices` tables and inserts sample data for 2 stores with representative prices.

---

## Step 2: Verify Sample Data

In Supabase Studio, confirm:

- `stores` table has at least 2 active rows
- `ingredient_prices` table has rows with recent `updated_at` values (within the last 7 days to avoid triggering the staleness warning on first run)

---

## Step 3: Verify the Feature

1. Start the dev server:
   ```bash
   cd supabase && npm run dev
   ```

2. **Unauthenticated test** (open a private/incognito window):
   - Navigate to `http://localhost:3000/groceries`
   - Confirm no "Cheapest Grocery Store" section appears — not even a loading indicator

3. **Authenticated test** (log in via `/login`):
   - Navigate to `http://localhost:3000/groceries`
   - Confirm the loading indicator appears briefly, then the store comparison section loads
   - Confirm stores are ranked cheapest to most expensive
   - Confirm the "prices as of" timestamp is shown

4. **Empty list test**:
   - Remove all recipes from the cook-next list
   - Navigate to `/groceries`
   - Confirm the store comparison section does not appear

---

## Maintaining Price Data

Prices are populated automatically by the sync job. The admin manages which stores are tracked and which canonical ingredient names the sync job looks up.

### Adding a new store

```sql
INSERT INTO stores (name, region)
VALUES ('Store Name', 'default');
```

After inserting a store, trigger a sync run to populate its prices.

### Adding a new ingredient to track

Add the canonical name to the sync job's ingredient list (see the sync job configuration in `app/api/sync-prices/route.ts`). The next sync run will fetch and upsert prices for that ingredient across all active stores.

### Triggering a manual sync

```bash
# Via Vercel cron endpoint (once deployed)
curl -X POST https://your-site.vercel.app/api/sync-prices \
  -H 'Authorization: Bearer $CRON_SECRET'

# Or invoke the function directly during local development
```

### Canonical name guidelines

- Use the shortest unambiguous root (e.g., `"flour"` not `"all-purpose flour"`)
- Lowercase only
- No amounts, no modifiers
- The normalization function in `lib/prices.ts` matches recipe ingredient names against these roots
- Avoid names that are substrings of unrelated ingredients (e.g., `"oil"` would match `"olive oil"`, `"sesame oil"`, and `"fish oil"` — use `"olive oil"` instead)
- Common roots: `eggs`, `butter`, `flour`, `milk`, `sugar`, `salt`, `olive oil`, `garlic`, `onion`, `chicken`, `beef`, `pasta`, `rice`, `tomato`, `lemon`

---

## Environment Variables

The feature's read path uses existing environment variables. The sync job (Phase 2) requires additional variables: a `SUPABASE_SERVICE_ROLE_KEY` for upsert writes, credentials for the chosen pricing data source, and a cron secret for the sync endpoint.

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Existing — no change |
| `SUPABASE_ANON_KEY` | Yes | Existing — used for price data reads |
| `SUPABASE_SERVICE_ROLE_KEY` | Sync job | Used by sync job for upsert writes (bypasses RLS); likely already configured for the import feature |
| *(API key)* | Sync job | Credentials for the chosen pricing data source; name TBD based on API/scraper choice |
| `CRON_SECRET` | Sync job | Shared secret to authenticate cron requests to the sync endpoint |
