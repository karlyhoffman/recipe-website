# Quickstart: Cheapest Grocery Store

**Phase 1 output** | Referenced from [plan.md](./plan.md)

---

## Prerequisites

- The `supabase/` project is running locally (`npm run dev` from `supabase/`)
- Supabase project is accessible (local or remote)
- The migration `0009_grocery_store_prices.sql` has been applied
- A Kroger Developer API account (see Step 1)

---

## Step 1: Register a Kroger Developer Application

1. Sign up at [developer.kroger.com](https://developer.kroger.com/).
2. Create a new application. The "Public" application type is sufficient — Client Credentials grant does not require redirect URIs.
3. Request the `product.compact` scope (required by the Products API endpoint used by the sync).
4. Save the generated `Client ID` and `Client Secret` — they go into env vars in Step 4.
5. (Optional) Note the Kroger `locationId` values for the stores you shop at. Use the [Locations API](https://developer.kroger.com/reference/api/locations-api-public) (`GET /v1/locations?filter.zipCode.near=<zip>`) or the Kroger website (the URL on a store page contains the locationId).

---

## Step 2: Apply the Migration

From the `supabase/` directory, apply the new migration using the Supabase MCP or CLI:

```bash
# Via Supabase CLI (if configured)
supabase db push

# Or apply the SQL directly in Supabase Studio → SQL Editor
```

The migration creates the `stores` and `ingredient_prices` tables and inserts sample store rows. **No `ingredient_prices` rows are seeded** — the first manual sync run (Step 5) populates prices. Until then, the section will render the FR-009 unavailability message; this is expected.

---

## Step 3: Configure Stores

In Supabase Studio, edit the seeded `stores` rows (or insert your own) to set:

- `name` — display name (e.g., `"Ralphs — Wilshire"`)
- `kroger_location_id` — the Kroger locationId from Step 1.5
- `is_active` — `true`

Each row must have a non-null `kroger_location_id`. Rows with `NULL` are silently skipped by the sync.

---

## Step 4: Configure Environment Variables

Add to `supabase/.env.local`:

```bash
KROGER_CLIENT_ID=<your client id from Step 1>
KROGER_CLIENT_SECRET=<your client secret from Step 1>
# SUPABASE_SERVICE_ROLE_KEY should already be present (PDF import feature uses it)
```

---

## Step 5: Run the First Sync

1. Start the dev server:
   ```bash
   cd supabase && npm run dev
   ```

2. Log in via `/login` and navigate to `http://localhost:3000/groceries`.

3. The Cheapest Grocery Store section will display the unavailability message (no prices synced yet). Click **Refresh prices**.

4. Wait for the sync to complete. On success, the section re-renders with ranked stores. On failure, an error message appears near the button — check the terminal logs for the underlying cause (usually missing env vars or an invalid `kroger_location_id`).

---

## Step 6: Verify the Feature

1. **Unauthenticated test** (open a private/incognito window):
   - Navigate to `http://localhost:3000/groceries`
   - Confirm no "Cheapest Grocery Store" section appears — not even a loading indicator or refresh button

2. **Authenticated test**:
   - Navigate to `http://localhost:3000/groceries`
   - Confirm the loading indicator appears briefly, then the store comparison section loads
   - Confirm stores are ranked cheapest to most expensive
   - Confirm the "prices as of" timestamp is shown
   - Confirm the "Refresh prices" button is visible

3. **Empty list test**:
   - Remove all recipes from the cook-next list
   - Navigate to `/groceries`
   - Confirm the store comparison section does not appear

4. **Staleness test**:
   - In Supabase Studio, manually backdate `ingredient_prices.updated_at` to 8+ days ago for one store
   - Reload `/groceries`
   - Confirm the staleness warning appears for that store

---

## Maintaining Price Data

Prices are populated by clicking the Refresh button. The admin manages which stores are tracked and which canonical ingredient names the sync job looks up.

### Adding a new store

```sql
INSERT INTO stores (name, region, kroger_location_id)
VALUES ('Store Name', 'default', '70300123');
```

After inserting a store, click Refresh prices on the grocery page to populate its prices.

### Adding a new ingredient to track

Edit the `CANONICAL_INGREDIENTS` constant at the top of `supabase/lib/sync-prices.ts` and add the new canonical name. The next sync run will fetch and upsert prices for that ingredient across all active stores.

### Canonical name guidelines

- Use the shortest unambiguous root (e.g., `"flour"` not `"all-purpose flour"`)
- Lowercase only
- No amounts, no modifiers
- The normalization function in `lib/prices.ts` matches recipe ingredient names against these roots
- Avoid names that are substrings of unrelated ingredients (e.g., `"oil"` would match `"olive oil"`, `"sesame oil"`, and `"fish oil"` — use `"olive oil"` instead)
- Common roots: `eggs`, `butter`, `flour`, `milk`, `sugar`, `salt`, `olive oil`, `garlic`, `onion`, `chicken`, `beef`, `pasta`, `rice`, `tomato`, `lemon`

---

## Environment Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Existing — no change |
| `SUPABASE_ANON_KEY` | Yes | Existing — used for price data reads |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Used by the sync action for upsert writes (bypasses RLS). Already configured for the PDF import feature. |
| `KROGER_CLIENT_ID` | Yes | Kroger Developer API Client ID (from Step 1). |
| `KROGER_CLIENT_SECRET` | Yes | Kroger Developer API Client Secret (from Step 1). |
