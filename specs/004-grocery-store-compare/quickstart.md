# Quickstart: Cheapest Grocery Store

**Phase 1 output** | Referenced from [plan.md](./plan.md)

---

## Prerequisites

- The `supabase/` project is running locally (`npm run dev` from `supabase/`)
- Supabase project is accessible (local or remote)
- The migration `0008_grocery_store_prices.sql` has been applied

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

Prices are maintained directly in the Supabase `ingredient_prices` table via Supabase Studio.

### Adding a new store

```sql
INSERT INTO stores (name, region)
VALUES ('Store Name', 'default');
```

### Adding / updating ingredient prices

```sql
-- Insert (first time)
INSERT INTO ingredient_prices (store_id, canonical_name, price, unit)
VALUES (
  '<store-uuid>',
  'flour',          -- canonical name: short, lowercase, no modifiers
  2.99,             -- price per unit
  'bag'             -- unit label shown to user
);

-- Update existing price (updated_at is set automatically by the trigger)
UPDATE ingredient_prices
SET price = 2.49
WHERE store_id = '<store-uuid>' AND canonical_name = 'flour';
```

### Marking an item out of stock

```sql
-- updated_at is set automatically by the trigger
UPDATE ingredient_prices
SET in_stock = false
WHERE store_id = '<store-uuid>' AND canonical_name = 'butter';
```

### Canonical name guidelines

- Use the shortest unambiguous root (e.g., `"flour"` not `"all-purpose flour"`)
- Lowercase only
- No amounts, no modifiers
- The normalization function in `lib/prices.ts` will match recipe ingredient names against these roots
- Common roots: `eggs`, `butter`, `flour`, `milk`, `sugar`, `salt`, `olive oil`, `garlic`, `onion`, `chicken`, `beef`, `pasta`, `rice`, `tomatoes`, `lemon`

---

## Environment Variables

No new environment variables are required. The feature uses the existing `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_ANON_KEY` for DB reads.

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Existing — no change |
| `SUPABASE_ANON_KEY` | Yes | Existing — used for price data reads |
