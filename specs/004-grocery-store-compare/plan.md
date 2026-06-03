# Implementation Plan: Cheapest Grocery Store

**Branch**: `specs/004-grocery-store-compare` | **Date**: 2026-06-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-grocery-store-compare/spec.md`

## Summary

Add a "Cheapest Grocery Store" section to the existing grocery page (`app/(utils)/groceries/page.tsx`). The section is conditionally rendered only for authenticated users with a non-empty ingredient list, using the existing `x-user-authenticated` header pattern (same as `Navbar.tsx`). Pricing data is stored in two new Supabase tables (`stores`, `ingredient_prices`) maintained manually by the admin via Supabase Studio. Price comparison is computed server-side in an async `StoreComparison` Server Component wrapped in a React Suspense boundary, enabling a loading state (FR-014) while the grocery list renders immediately. Staleness and unavailability are derived from `max(ingredient_prices.updated_at)` per store. Zero new npm packages are required.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 16 (App Router), React 19

**Primary Dependencies**: No new dependencies. Existing: `@supabase/ssr`, `classnames`, Next.js 16, React 19.

**Storage**: Supabase (PostgreSQL) — 2 new tables: `stores`, `ingredient_prices`. See [data-model.md](./data-model.md).

**Testing**: ESLint only (no test framework in project)

**Target Platform**: Next.js 16 App Router, Vercel deployment

**Performance Goals**:
- Price comparison section visible within 10 seconds of page load (SC-001)
- Recalculation completes within 2 seconds when ingredient list changes (FR-011)
- All data read from Supabase (locally stored); no live external API calls at page load (SC-001 clarification)

**Constraints**:
- Zero or low recurring cost — data is admin-maintained; no external API (FR-013)
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
│   └── 0008_grocery_store_prices.sql     # stores + ingredient_prices tables + sample data
├── lib/
│   └── prices.ts                          # Price fetching + normalization + comparison logic
├── components/
│   └── StoreComparison.tsx               # Async Server Component (auth-gated via props)
└── styles/
    └── components/
        └── store-comparison.module.scss  # Styles for the comparison section
```

**Existing files to modify:**

```text
supabase/
├── app/(utils)/groceries/page.tsx  # Add headers() auth check + Suspense + StoreComparison
└── types/index.ts                  # Add Store, IngredientPrice, StoreComparisonEntry, PriceComparisonResult types
```

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
  1. Fetch active stores from Supabase
  2. Fetch all ingredient_prices for those stores
  3. For each store:
     a. Normalize each ingredientName from the list
     b. For each normalized name, find matching price rows (canonical_name substring match)
     c. When multiple matches: select lowest price (FR-015)
     d. Classify each ingredient as matched (in_stock=true) or unmatched (no_match | out_of_stock)
     e. Sum matched prices → totalCost
     f. Derive lastUpdated = max(ingredient_prices.updated_at) for store
     g. Derive isStale = lastUpdated < now - 7 days
  4. Sort entries by totalCost ascending (cheapest first, FR-002)
  5. Set isUnavailable = true if no stores have any price records
  6. Return PriceComparisonResult
```

**Normalization function** (in `lib/prices.ts`): see [research.md — Decision 2](./research.md) for the full rule set.

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
