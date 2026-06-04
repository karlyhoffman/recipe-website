# Implementation Plan: Cheapest Grocery Store

**Branch**: `specs/004-grocery-store-compare` | **Date**: 2026-06-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-grocery-store-compare/spec.md`

## Summary

Add a "Cheapest Grocery Store" section to the existing grocery page (`app/(utils)/groceries/page.tsx`). The section is conditionally rendered only for authenticated users with a non-empty ingredient list, using the existing `x-user-authenticated` header pattern (same as `Navbar.tsx`). Pricing data is stored in two new Supabase tables (`stores`, `ingredient_prices`) populated by user-initiated sync runs against the Kroger Developer API (free-tier Client Credentials OAuth). Each `stores` row carries a `kroger_location_id` identifying which Kroger-family store to query. The admin triggers sync runs via a "Refresh prices" button rendered inside the section (FR-016), which invokes a Next.js Server Action that runs the sync and calls `revalidatePath('/groceries')` to re-render with fresh data. No cron job, no scheduled background work. Price comparison is computed server-side in an async `StoreComparison` Server Component wrapped in a React Suspense boundary, enabling a loading state (FR-014) while the grocery list renders immediately. Staleness and unavailability are derived from `max(ingredient_prices.updated_at)` per store. Zero new npm packages are required (the Kroger client is plain `fetch`).

## Technical Context

**Language/Version**: TypeScript 5, Next.js 16 (App Router), React 19

**Primary Dependencies**: Existing: `@supabase/ssr`, `classnames`, Next.js 16, React 19. No new npm packages — the Kroger API client uses plain `fetch`.

**Storage**: Supabase (PostgreSQL) — 2 new tables: `stores`, `ingredient_prices`. See [data-model.md](./data-model.md).

**Testing**: ESLint only (no test framework in project)

**Target Platform**: Next.js 16 App Router, Vercel deployment

**Performance Goals**:
- Price comparison section visible within 10 seconds of page load (SC-001)
- Recalculation completes within 2 seconds when ingredient list changes (FR-011)
- All data read from Supabase (locally stored); no live external API calls at page load (SC-001 clarification)

**Constraints**:
- Zero or low recurring cost — pricing data from the Kroger Developer API free tier (FR-013); no paid per-query APIs
- Kroger-family stores only — non-Kroger US chains (Whole Foods, Trader Joe's, Safeway, Aldi, etc.) are out of scope for this spec
- Single geographic region; region is a fixed value in the `stores.region` column (FR-012)
- Single-admin personal site; no concurrency concerns

**Scale/Scope**: Single-admin personal recipe website. ~2–5 stores, ~50–150 ingredient price records.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| 1. User-Centered Content | ✅ Pass | Section helps the admin make smarter grocery decisions using their existing recipe data. Public recipe browsing is completely unaffected — the section is invisible to unauthenticated users. |
| 2. Maintainable Frontend Architecture | ✅ Pass | `StoreComparison` is an async Server Component following the existing pattern. `lib/prices.ts` mirrors `lib/data.ts`. Styles in a new `styles/components/store-comparison.module.scss` following the existing `components/` pattern. No new Client Components. |
| 3. Data Integrity & Content Reliability | ✅ Pass | Section degrades gracefully: loading state while computing (FR-014), staleness warning when data is old (FR-008), unavailability message when no data exists (FR-009). Unmatched ingredients are surfaced rather than silently excluded. |
| 4. Quality through Documentation & Review | ✅ Pass | Plan, research, data model, and quickstart documented. Migration follows the existing `migrations/0NNN_*.sql` naming convention. PR must include migration instructions and manual test steps. |
| 5. Performance and Reliability | ✅ Pass | React Suspense streaming: grocery list renders immediately; comparison loads asynchronously. Price computation is a single Supabase query + in-memory map/sort — minimal server load. |
| 6. Incremental Delivery & Observability | ✅ Pass | Phases are independently verifiable: migration → `lib/prices.ts` → `StoreComparison` component → grocery page integration → styles. Each phase has explicit acceptance criteria. |
| 7. Codebase Consistency & Pattern Adherence | ✅ Pass | Reviewed `groceries/page.tsx`, `Navbar.tsx` (auth header pattern), `lib/data.ts` (data fetching), `types/index.ts` (type pattern), and `migrations/` (SQL conventions) before designing. All new code mirrors established patterns. |

**No constitution violations.** No complexity justification required.

## Project Structure

### Documentation (this feature)

```text
specs/004-grocery-store-compare/
├── plan.md              # This file
├── research.md          # Phase 0 decisions
├── data-model.md        # Phase 1 DB schema + TypeScript types
├── quickstart.md        # Phase 1 setup and price maintenance guide
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code Changes (in `supabase/`)

**New files:**

```text
supabase/
├── migrations/
│   └── 0009_grocery_store_prices.sql     # stores (with kroger_location_id) + ingredient_prices tables + seed stores (no seeded prices)
├── lib/
│   ├── prices.ts                          # Price fetching + normalization + comparison logic
│   ├── kroger.ts                          # Kroger API client: getAccessToken + searchProduct (uses fetch)
│   └── sync-prices.ts                     # syncPrices() orchestrator + CANONICAL_INGREDIENTS constant
├── components/
│   ├── StoreComparison.tsx                # Async Server Component (auth-gated via props)
│   └── RefreshPricesButton.tsx            # Client Component: invokes Server Action, shows pending/error state
├── styles/
│   └── components/
│       └── store-comparison.module.scss   # Styles for the comparison section (incl. refresh button + error)
└── app/(utils)/groceries/actions.ts       # Server Action: refreshPricesAction (auth check + sync + revalidatePath)
```

**Existing files to modify:**

```text
supabase/
├── app/(utils)/groceries/page.tsx  # Add headers() auth check + Suspense + StoreComparison
└── types/index.ts                  # Add Store (with kroger_location_id), IngredientPrice, StoreComparisonEntry, PriceComparisonResult types
```

**Not built** (previously planned, now dropped):
- `supabase/app/api/sync-prices/route.ts` — no cron means no cron-target route is needed; the Server Action replaces it.
- `CRON_SECRET` env var — no longer required.

**Structure Decision**: Single-project web application. All new files follow the existing `supabase/` layout: `lib/` for data functions, `components/` for React components, `styles/components/` for component-scoped SCSS, `migrations/` for SQL migrations.

---

## Architecture Notes

### Auth Gating Pattern

The grocery page reads the `x-user-authenticated` header (set by the proxy on every request) via Next.js `headers()`:

```tsx
// app/(utils)/groceries/page.tsx (simplified)
import { headers } from 'next/headers';

export default async function Groceries() {
  const headersList = await headers();
  const isAuthenticated = headersList.get('x-user-authenticated') === 'true';
  const cookNextRecipes = await getCookNextRecipes();

  const ingredientNames = isAuthenticated
    ? [...new Set(
        cookNextRecipes.flatMap(r =>
          r.ingredients.filter(i => i.type === 'ingredient').map(i => i.name)
        )
      )]
    : [];

  return (
    <Row className={styles.groceries}>
      {/* existing content */}

      {isAuthenticated && ingredientNames.length > 0 && (
        <Column>
          <Suspense fallback={<StoreComparisonLoading />}>
            <StoreComparison ingredientNames={ingredientNames} />
          </Suspense>
        </Column>
      )}
    </Row>
  );
}
```

This ensures:
- Unauthenticated users see no trace of the section (FR-001 / SC-005)
- Loading fallback only appears for authenticated users (FR-014)
- Section hidden when ingredient list is empty (FR-010)

### StoreComparison Component

Async Server Component. Receives `ingredientNames: string[]` from the grocery page. Calls `computePriceComparison()` from `lib/prices.ts`. Handles all three display states: unavailable, stale + current, loading (via Suspense fallback).

### lib/prices.ts — Core Logic

```text
computePriceComparison(ingredientNames: string[]): Promise<PriceComparisonResult>
  Wrapped in try/catch — on any DB error, returns { entries: [], isUnavailable: true, totalIngredients: n }
  so the StoreComparison component renders the FR-009 unavailability message rather than a 500.

  1. Fetch active stores from Supabase
  2. Fetch all ingredient_prices for those stores
  3. For each store:
     a. If the store has no price records, skip it (excluded from entries; not shown as $0)
     b. Normalize each ingredientName from the list
     c. For each normalized name, find matching price rows (canonical_name substring of normalized name)
     d. When multiple canonicals match: select lowest price (FR-015)
     e. Classify each ingredient as matched (in_stock=true) or unmatched (no_match | out_of_stock)
     f. Sum matched prices → totalCost
     g. Derive lastUpdated = max(ingredient_prices.updated_at) for store
     h. Derive isStale = lastUpdated < now - 7 days
  4. Sort entries by totalCost ascending (cheapest first, FR-002)
  5. Set isUnavailable = true if entries is empty (all active stores were skipped in step 3a)
  6. Return PriceComparisonResult
```

**Normalization function** (in `lib/prices.ts`): see [research.md — Decision 2](./research.md) for the full rule set.

### Sync Trigger (FR-016, FR-017)

Sync is user-initiated via a "Refresh prices" button rendered inside `StoreComparison`. No cron, no scheduled work.

Flow:
1. `RefreshPricesButton` (Client Component) calls the `refreshPricesAction` Server Action via `useTransition`.
2. The action re-checks the `x-user-authenticated` header (defense in depth — the proxy already gates the page), then calls `syncPrices()` from `lib/sync-prices.ts`.
3. `syncPrices()`:
   - Fetches active stores with non-null `kroger_location_id` via the service-role Supabase client.
   - Acquires a Kroger access token via `getAccessToken()` (cached in-memory for the duration of this call).
   - Iterates the `CANONICAL_INGREDIENTS` constant; for each `(store, canonical)` pair, calls `searchProduct(token, locationId, canonical)` and upserts into `ingredient_prices` (`UNIQUE(store_id, canonical_name)`).
   - Per-ingredient errors are logged and skipped; auth failure throws and surfaces to the action.
4. The action calls `revalidatePath('/groceries')`, which causes Next.js to re-render the page server-side. The Suspense boundary kicks back in, `StoreComparison` recomputes with the new data, and the user sees the updated prices on the next paint.
5. The action returns `{ ok, error?, summary? }`. On error, the button displays "Refresh failed — try again" near itself; previous prices remain visible (FR-017).

Concurrency: `useTransition` disables the button during pending state. Upserts are idempotent (unique constraint), so any rare concurrent run only repeats work — no data corruption.

### Recalculation Behavior (FR-011)

The grocery page is server-rendered on every request. When the cook-next list changes (managed elsewhere), the user navigates to the grocery page → new server render → new price comparison. The browser's default navigation behavior ("previous page remains visible until new page loads") satisfies "previous result remains visible during recalculation." The 2-second recalculation target is a page-load performance target, not a client-side update.

### Styling

New SCSS file `styles/components/store-comparison.module.scss` following the same BEM + SCSS module pattern as `styles/components/pdf-import.module.scss`. Imports `_tokens.scss` and `_breakpoints.scss` using `@use`.

---

## Phase 0 Output

See [research.md](./research.md) — all decisions documented, no NEEDS CLARIFICATION items remain.

## Phase 1 Output

See [data-model.md](./data-model.md) — DB schema, TypeScript types, migration file specification.

See [quickstart.md](./quickstart.md) — setup guide, price maintenance instructions.
