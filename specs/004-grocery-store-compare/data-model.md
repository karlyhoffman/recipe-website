# Data Model: Cheapest Grocery Store

**Phase 1 output** | Referenced from [plan.md](./plan.md)

---

## Database Tables

### `stores`

Represents a grocery store included in the price comparison.

```sql
CREATE TABLE stores (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  region     TEXT        NOT NULL DEFAULT 'default',
  is_active  BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Store display name (e.g., "Whole Foods", "Trader Joe's") |
| `region` | TEXT | Geographic region identifier (FR-012); single value, configured by admin |
| `is_active` | BOOLEAN | When `false`, store is excluded from comparisons without deleting its price data |
| `created_at` | TIMESTAMPTZ | Row creation timestamp |

---

### `ingredient_prices`

Stores the known unit price of a canonical ingredient at a specific store. One row per store-per-ingredient combination (lowest price wins when multiple products match — enforced at query time, not schema level, per FR-015).

```sql
CREATE TABLE ingredient_prices (
  id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id       UUID           NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  canonical_name TEXT           NOT NULL,
  price          NUMERIC(10,2)  NOT NULL CHECK (price >= 0),
  unit           TEXT           NOT NULL,
  in_stock       BOOLEAN        NOT NULL DEFAULT TRUE,
  updated_at     TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE INDEX ingredient_prices_store_id_idx       ON ingredient_prices(store_id);
CREATE INDEX ingredient_prices_canonical_name_idx ON ingredient_prices(canonical_name);
```

**`updated_at` trigger** — auto-sets the timestamp on every `UPDATE` so the admin cannot accidentally leave it stale by omitting it from a manual SQL statement:

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER ingredient_prices_set_updated_at
  BEFORE UPDATE ON ingredient_prices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

The trigger ensures `updated_at` always reflects the actual time of the last change, which the staleness indicator (FR-007, FR-008) depends on. `SECURITY INVOKER` and `SET search_path = ''` follow the established pattern from `0004_fix_security_warnings.sql`.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `store_id` | UUID | FK → `stores.id` |
| `canonical_name` | TEXT | Normalized ingredient name (e.g., `"flour"`, `"eggs"`, `"butter"`). Admin-controlled. Used for matching recipe ingredient names after normalization (FR-015). |
| `price` | NUMERIC(10,2) | Unit price (e.g., `0.89` for `$0.89/lb`) |
| `unit` | TEXT | Unit label displayed to user (e.g., `"lb"`, `"dozen"`, `"each"`, `"jar"`) |
| `in_stock` | BOOLEAN | When `false`, treated identically to an unmatched ingredient — excluded from total and listed separately (FR-006) |
| `updated_at` | TIMESTAMPTZ | Last time this price was updated by the admin. Drives the "prices as of" timestamp (FR-007) and the staleness indicator (FR-008). |

**Freshness semantics** (per-store):
- `max(updated_at)` across all active rows for a store = "prices as of" timestamp for that store
- If `max(updated_at) < now() - 7 days` → stale (FR-008)
- If no rows exist for any active store → unavailable (FR-009)

**Canonical name examples** (admin-maintained):

| `canonical_name` | Matches recipe ingredients |
|-----------------|---------------------------|
| `"flour"` | "all-purpose flour", "plain flour", "2 cups flour" |
| `"eggs"` | "large eggs", "3 eggs", "egg" |
| `"butter"` | "unsalted butter", "salted butter", "2 tbsp butter" |
| `"garlic"` | "fresh garlic", "minced garlic", "garlic cloves" |

---

## No Additional Tables

No `price_sync_events` table is needed. Since data is admin-maintained (not synced from an external source), freshness is derived directly from `ingredient_prices.updated_at`. See [research.md — Decision 4](./research.md) for rationale.

---

## TypeScript Types

Added to `supabase/types/index.ts`:

```ts
export interface Store {
  id: string;
  name: string;
  region: string;
  is_active: boolean;
}

export interface IngredientPrice {
  id: string;
  store_id: string;
  canonical_name: string;
  price: number;
  unit: string;
  in_stock: boolean;
  updated_at: string; // ISO 8601
}

export interface MatchedIngredient {
  ingredientName: string;  // original recipe ingredient name (for display)
  canonicalName: string;   // matched canonical_name
  price: number;
  unit: string;
}

export interface UnmatchedIngredient {
  name: string;
  reason: 'no_match' | 'out_of_stock';
}

export interface StoreComparisonEntry {
  store: Store;
  matchedIngredients: MatchedIngredient[];
  unmatchedIngredients: UnmatchedIngredient[];
  totalCost: number;            // sum of matched ingredient prices
  matchedCount: number;         // count of unique ingredient names matched
  lastUpdated: string;          // ISO 8601 — max(updated_at) for this store
  isStale: boolean;             // true if lastUpdated > 7 days ago
}

export interface PriceComparisonResult {
  entries: StoreComparisonEntry[];  // sorted cheapest first by totalCost
  totalIngredients: number;          // unique ingredient names in the list (denominator for "X of Y priced")
  isUnavailable: boolean;            // true if no ingredient_prices rows exist for any active store
}
```

---

## Migration File

**File**: `supabase/migrations/0009_grocery_store_prices.sql`

Contains:
1. `CREATE TABLE stores`
2. `CREATE TABLE ingredient_prices`
3. `CREATE INDEX` statements
4. `CREATE FUNCTION set_updated_at()` + `CREATE TRIGGER ingredient_prices_set_updated_at`
5. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` for both tables
6. `CREATE POLICY "public read"` for both tables
7. Sample `INSERT` statements for 2+ stores with representative prices (to pass SC-002 and allow immediate testing)

---

## Row-Level Security

```sql
ALTER TABLE stores            ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_prices ENABLE ROW LEVEL SECURITY;

-- Reads are public, matching the "public read" pattern on all other tables in this project.
-- No INSERT/UPDATE/DELETE policies are defined for anon or authenticated;
-- service_role (used by Supabase Studio) bypasses RLS and is the only write path.
CREATE POLICY "public read" ON stores            FOR SELECT USING (true);
CREATE POLICY "public read" ON ingredient_prices FOR SELECT USING (true);
```

**Access model**: price data (store names, ingredient prices) is not personally sensitive, and the existing project tables (`recipes`, `ingredient_entries`, etc.) are all publicly readable under the same pattern. The "no trace" requirement (FR-001, SC-005) applies to the rendered UI — enforced by the server component's auth check — not to the Supabase Data API. Enabling RLS explicitly makes the write-block intentional rather than relying on implicit defaults.
