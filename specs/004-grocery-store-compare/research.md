# Research: Cheapest Grocery Store

**Phase 0 output** | Referenced from [plan.md](./plan.md)

---

## Decision 1: Pricing Data Source — Kroger Developer API

**Decision**: The sync job ingests prices from the [Kroger Developer API](https://developer.kroger.com/) (free tier, Client Credentials OAuth). On each sync run, the job upserts current prices into `ingredient_prices`. The app reads exclusively from these locally-stored tables at page load — no live external API calls at request time (SC-001 clarification).

**Scope**: Kroger-family stores only — Kroger, Ralphs, King Soopers, Fred Meyer, Harris Teeter, Smith's, QFC, Dillons, Pick'n Save, Mariano's, Food 4 Less, Fry's, City Market. Non-Kroger US chains (Whole Foods, Trader Joe's, Safeway, Aldi, etc.) are out of scope for this spec.

**Rationale**: FR-013 requires zero or low recurring cost. The Kroger API meets this — free tier, structured product and pricing data with per-`locationId` granularity, standard OAuth authentication, no scraping maintenance burden. The single-source decision keeps the sync code small (one client, one auth flow) and avoids per-store DOM-scraping fragility.

**API surface used**:
- `POST /v1/connect/oauth2/token` (Client Credentials grant) — obtain an access token (~30 min TTL). Cached in-memory per sync run.
- `GET /v1/products?filter.term=<canonical>&filter.locationId=<id>&filter.limit=5` — search products by name at a specific store. Returns price, size, and stock status. Lowest in-stock match wins (FR-015).

**Store identification**: each `stores` row carries a `kroger_location_id` (see [data-model.md](./data-model.md)). The admin populates this column when inserting a store row. Rows with `NULL` are skipped silently by the sync job.

**Canonical ingredient list**: a hardcoded `CANONICAL_INGREDIENTS: string[]` constant in `supabase/lib/sync-prices.ts`. The admin edits this constant to track a new ingredient. The constant is intentionally not a database table — for a single-admin site, a code constant is simpler than schema migrations + a CRUD UI to maintain. See [research.md — Decision 8](#decision-8-sync-trigger-mechanism) for the sync trigger.

**Known limitations**:
- Prices are only as current as the last sync click. Staleness (FR-008) and unavailability (FR-009) states surface this transparently.
- The Kroger API returns prices that vary slightly by promotion window; the sync captures whatever the API returns at click time.
- Region coverage is limited to ZIP codes where Kroger-family stores operate. Admins outside Kroger's footprint cannot use this feature without a follow-on spec that adds an additional data source.

**Alternatives considered**:
- **Multi-source (Kroger API + custom scrapers)** — Originally considered for non-Kroger stores. Rejected as out of scope to keep this spec deliverable. A future spec can add scrapers behind a `source` column on `stores` without breaking the existing schema.
- **Admin-maintained Supabase tables** — Requires the admin to manually enter and update every price via Supabase Studio. Error-prone, tedious at scale, and easy to neglect. Rejected.
- **Open Food Facts** — Provides product data but not current retail prices. Rejected.
- **Paid per-query APIs or commercial data feeds** — Ongoing cost. Rejected per FR-013.

---

## Decision 2: Ingredient Normalization Strategy

**Decision**: Canonical name matching — each `ingredient_prices` row stores a `canonical_name` (e.g., `"flour"`, `"eggs"`, `"butter"`). A TypeScript normalization function strips common cooking adjectives and measurements from recipe ingredient names, then checks for substring/equality match against canonical names.

**Rationale**: FR-015 requires normalization (e.g., `"all-purpose flour"` → matches `"flour"`). For a manually maintained database, the admin controls the canonical names and ensures they are short, unambiguous roots (e.g., `"flour"`, not `"all-purpose flour"`). The normalization function strips common modifiers so that `"fresh garlic"`, `"minced garlic"`, and `"garlic cloves"` all match the canonical `"garlic"`. When multiple products at a store match a single ingredient, the lowest-priced match is used (FR-015).

**Normalization rules** (applied in `lib/prices.ts`):
1. Lowercase, trim whitespace
2. Strip leading amounts (numbers, fractions: `"2 cups"`, `"1/2 tsp"`)
3. Strip common cooking adjectives: `fresh`, `dried`, `frozen`, `organic`, `large`, `small`, `medium`, `extra`, `whole`, `all-purpose`, `plain`, `unsalted`, `salted`, `boneless`, `skinless`, `ground`, `minced`, `chopped`, `diced`, `sliced`, `grated`, `shredded`
4. Strip trailing parenthetical notes (e.g., `"(or substitute)"`)
5. Normalize plurals, applied in order:
   - `ies` → `y` (e.g., `"berries"` → `"berry"`, `"cherries"` → `"cherry"`)
   - `oes` → `o` (e.g., `"tomatoes"` → `"tomato"`, `"potatoes"` → `"potato"`)
   - trailing `s` if word is longer than 3 characters (e.g., `"eggs"` → `"egg"`, `"carrots"` → `"carrot"`)

**Matching**: for each recipe ingredient name (post-normalization), find all `ingredient_prices` rows where `canonical_name` is a substring of the normalized name. If multiple rows match (same store, different canonical names), select the lowest price (FR-015).

**Canonical name guideline**: canonical names must be short root forms so they appear as substrings of common recipe ingredient names after normalization. Avoid canonicals that are substrings of unrelated ingredients — for example, `"oil"` would match `"olive oil"`, `"sesame oil"`, and `"fish oil"` simultaneously. Use `"olive oil"` as the canonical if that is the specific product stocked.

**Alternatives considered**:
- **Fuzzy matching (Levenshtein distance)** — More accurate but adds implementation complexity and risk of false positives. Not needed for a curated admin-maintained dataset. Rejected.
- **Embedding-based semantic matching** — Adds external AI API dependency per query. Overkill for a manually curated list of ~50–100 canonical ingredients. Rejected.

---

## Decision 3: Loading State Implementation

**Decision**: React Suspense wrapping an async `StoreComparison` Server Component

**Rationale**: Next.js App Router supports streaming Server Components via React Suspense. The `StoreComparison` component is an async Server Component that awaits the Supabase price query. Wrapping it in `<Suspense fallback={<LoadingState />}>` in the grocery page enables the loading indicator (FR-014) while the grocery list itself renders immediately. This requires no client-side JavaScript for the loading state and no new Client Components.

**Auth gating**: The Suspense boundary (and thus the loading fallback) is only rendered when the user is authenticated AND the ingredient list is non-empty. Unauthenticated users see no Suspense, no fallback, no loading indicator — satisfying FR-001's "no trace" requirement.

**Alternatives considered**:
- **Client Component with `useEffect` fetch** — Adds client-side hydration overhead. Requires a new API route to expose price data as JSON. Price data unnecessarily exposed in the network tab. Rejected.
- **`loading.tsx` file** — Applies to the entire route; cannot be scoped to just the StoreComparison section. Rejected.

---

## Decision 4: Staleness and Unavailability Detection

**Decision**: Derive both states from `ingredient_prices.updated_at` — no separate sync event table.

**Rationale**: The sync job upserts into `ingredient_prices` on every successful run, which sets `updated_at` automatically via the trigger. Freshness is derived per-store from these timestamps:

- **Unavailable**: no `ingredient_prices` rows exist for any active store (sync has never run successfully, or all runs have failed since the table was created)
- **Stale**: for a given store, `max(updated_at)` is more than 7 days ago (sync ran but has not updated this store within the expected window)
- **Current**: for a given store, `max(updated_at)` is within the last 7 days

The "prices as of" timestamp shown in the UI (FR-007) is `max(ingredient_prices.updated_at)` for that store's price records.

**Known limitation**: a sync run that updates a single price row refreshes `max(updated_at)` for the entire store, marking it current even if most prices were not changed in that run. For the expected sync workflow (weekly full-store price refresh), this is an accepted tradeoff — the timestamp is a best-effort signal.

**Optional audit trail**: a `price_sync_logs` table (id, started_at, completed_at, status, rows_updated, error) can be added to track sync history for debugging. It is not required for the core feature since `updated_at` captures the same effective freshness signal. Implementation is deferred to the sync job build.

**Alternatives considered**:
- **Required `price_sync_events` table** — Adds mandatory schema complexity and a required write step in the sync job. Unnecessary since `updated_at` captures the same signal. Rejected; an optional `price_sync_logs` table is useful for debugging but not required by this spec.

---

## Decision 5: Data Access Pattern (No New API Routes)

**Decision**: All price computation is done server-side in the async `StoreComparison` Server Component via `lib/prices.ts`. No new API routes.

**Rationale**: The spec says "always reads from the most recent sync stored locally; no live external calls at page load time" (Clarifications). Since all price data is in Supabase (already "local" to the server), a direct DB query from the Server Component satisfies this. No new Route Handler is needed. This avoids exposing raw price data as a JSON endpoint and maintains the existing pattern of server-side data fetching in `lib/data.ts`.

**Data access**: `StoreComparison` uses `createClient()` from `lib/supabase.ts` (anon key) to query `stores` and `ingredient_prices`. Since the component only renders for authenticated users (checked by the parent grocery page before mounting the Suspense boundary), price data is never sent to unauthenticated clients.

---

## Decision 6: Auth Gating Approach

**Decision**: Read `x-user-authenticated` header in the grocery page (`app/(utils)/groceries/page.tsx`), mirroring the existing `Navbar.tsx` pattern. Only mount the `<Suspense> / <StoreComparison>` tree when `isAuthenticated === true`.

**Rationale**: The proxy sets `x-user-authenticated` on every request. Reading it in a Server Component via `headers()` is the established pattern for auth-conditional rendering in this codebase. No proxy changes are required — the grocery route is public, but the StoreComparison section within it is auth-gated at the component level.

**Security note**: The proxy overwrites `x-user-authenticated` on every request, so clients cannot spoof this header. The `StoreComparison` component (and `lib/prices.ts`) are only invoked server-side and only when the proxy has confirmed authentication.

---

## Decision 7: No New Dependencies

**Decision**: Zero new npm packages.

**Rationale**: All required functionality (Supabase queries, TypeScript types, React Suspense, Next.js `headers()`, Next.js Server Actions, the Kroger API client via `fetch`) is already available in the project. The normalization function is pure JavaScript. No external API client library, scraping library, or fuzzy-match library is needed.

---

## Decision 8: Sync Trigger Mechanism

**Decision**: User-initiated sync via a "Refresh prices" button rendered inside the `StoreComparison` section. No cron job, no scheduled background task.

**Rationale**: The site is single-admin and the use case is "I'm about to do my weekly grocery shop." A manual button matches that workflow directly — the admin clicks before each trip, getting fresh prices on demand. A cron job would either (a) waste API quota refreshing prices on weeks the admin doesn't shop, or (b) run on a fixed schedule that drifts from the admin's actual shopping cadence. The staleness warning (FR-008) becomes the prompt: when the admin sees "prices are 8 days old," they click Refresh.

**Implementation**: a Next.js Server Action (`refreshPricesAction` in `app/(utils)/groceries/actions.ts`) is invoked by a Client Component button. The action:
1. Re-checks `x-user-authenticated` for defense in depth (proxy already sets it).
2. Calls `syncPrices()` from `lib/sync-prices.ts`.
3. Calls `revalidatePath('/groceries')` so the section re-renders with the new data.
4. Returns `{ ok, error?, summary? }` to the button for status display.

**Concurrency**: the button uses React's `useTransition` and is disabled during pending state, preventing the admin from double-clicking. There is no server-side lock — the sync is idempotent (`UNIQUE(store_id, canonical_name)` upserts), so a rare concurrent click would only repeat work, not corrupt data.

**Failure mode**: on sync error, the previous price data remains visible (no destructive overwrite). The button surfaces "Refresh failed — try again" near itself (FR-017). A failed sync MUST NOT trigger the FR-009 unavailability message — that message is reserved for "no data has ever been synced."

**Alternatives considered**:
- **Vercel cron (weekly)** — Predictable cadence but runs whether the admin needs fresh prices or not, and decouples sync from shopping intent. Rejected.
- **Cron + button (hybrid)** — Cron as fallback, button for on-demand. Adds operational complexity (CRON_SECRET, scheduling config) for a benefit the admin doesn't need on a personal site. Rejected.
- **Auto-refresh on page load if stale** — Adds latency to grocery page renders and runs the sync without explicit consent. Rejected; the staleness warning + button is more transparent.
