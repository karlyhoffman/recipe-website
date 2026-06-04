# Tasks: Cheapest Grocery Store

**Input**: Design documents from `specs/004-grocery-store-compare/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: No test tasks generated — project uses ESLint only (no test framework).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- All tasks include exact file paths

---

## Phase 1: Setup (Migration)

**Purpose**: Create and apply the database schema required by all user stories.

- [ ] T001 Create `supabase/migrations/0009_grocery_store_prices.sql` with: `stores` table (including `kroger_location_id TEXT` nullable column), `ingredient_prices` table (UNIQUE on store_id+canonical_name), two indexes, `set_updated_at` trigger function + trigger, RLS ENABLE + "public read" policies for both tables, and seed INSERT statements for 2+ stores with real Kroger `kroger_location_id` values. **No seed `ingredient_prices` rows** — the first manual sync run (Phase 6, T015 + T019) populates them.
- [ ] T002 Apply migration `supabase/migrations/0009_grocery_store_prices.sql` to Supabase (via `supabase db push` from `supabase/` or Supabase Studio SQL editor); verify `stores` has ≥2 active rows each with a non-null `kroger_location_id`. The `ingredient_prices` table will be empty until Phase 6 — the StoreComparison section will render the FR-009 unavailability message during Phases 3–5; this is intentional.

---

## Phase 2: Foundational (Blocking Prerequisite)

**Purpose**: TypeScript types shared by all user stories and the data-fetch library.

**⚠️ CRITICAL**: User story work cannot start until this phase is complete.

- [ ] T003 Add `Store` (with `kroger_location_id: string | null`), `IngredientPrice`, `MatchedIngredient`, `UnmatchedIngredient`, `StoreComparisonEntry`, and `PriceComparisonResult` TypeScript interfaces to `supabase/types/index.ts` per data-model.md

**Checkpoint**: Types available — US1, US2, US3 can now proceed.

---

## Phase 3: User Story 1 — Store Price Ranking (Priority: P1) 🎯 MVP

**Goal**: Authenticated users see a Cheapest Grocery Store section on the grocery page showing stores ranked cheapest to most expensive, with a loading indicator while computing.

**Independent Test**: Log in, navigate to `/groceries` with ≥1 ingredient in the list, confirm the section appears with stores ranked by total price. In an incognito window, confirm the section is completely absent.

### Implementation for User Story 1

- [ ] T004 [P] [US1] Implement `normalizeIngredientName()` and `computePriceComparison(ingredientNames: string[])` in `supabase/lib/prices.ts`: fetch active stores and all ingredient_prices via anon Supabase client, normalize names per research.md Decision 2 rules, match by canonical_name substring, select lowest price per ingredient per store (FR-015), sum matched prices, derive `lastUpdated` = max(updated_at) and `isStale` = lastUpdated < 7 days ago per store, sort entries by totalCost ascending, set `isUnavailable` when entries is empty; wrap entire function in try/catch returning `{ entries: [], isUnavailable: true, totalIngredients: n }` on DB error
- [ ] T005 [P] [US1] Create `supabase/styles/components/store-comparison.module.scss` with basic section layout styles (section wrapper, store card list, ranked store card, store name, total cost, loading skeleton); use `@use` for `_tokens.scss` and `_breakpoints.scss` following the pattern in `styles/components/pdf-import.module.scss`
- [ ] T006 [US1] Create `supabase/components/StoreComparison.tsx` as an async Server Component: accept `ingredientNames: string[]`, call `computePriceComparison()`, render ranked store cards showing store name and total cost per store; export a named `StoreComparisonLoading` component (Suspense fallback) in the same file; apply classes from `store-comparison.module.scss` (depends on T004, T005)
- [ ] T007 [US1] Update `supabase/app/(utils)/groceries/page.tsx`: extract `ingredientNames` using the existing `isAuthenticated` check pattern from `Navbar.tsx`; conditionally render `<Suspense fallback={<StoreComparisonLoading />}><StoreComparison ingredientNames={ingredientNames} /></Suspense>` only when `isAuthenticated && ingredientNames.length > 0` (depends on T006)

**Checkpoint**: US1 fully functional — authenticated users see ranked stores, unauthenticated users see nothing, empty list hides the section, loading state visible while computing.

---

## Phase 4: User Story 2 — Per-Ingredient Price Breakdown (Priority: P2)

**Goal**: Each store entry shows a per-ingredient breakdown: matched ingredients with unit price, unmatched/out-of-stock ingredients labelled separately, and a "X of Y ingredients priced" count.

**Independent Test**: With the section visible, view the per-ingredient breakdown for any store and confirm each matched ingredient shows its unit price and unit label; confirm unmatched ingredients are listed separately with a "price not available" label; confirm the match count is visible.

### Implementation for User Story 2

- [ ] T008 [P] [US2] Extend `supabase/components/StoreComparison.tsx` to render per-ingredient breakdown within each store card: iterate `matchedIngredients` to display ingredient name + `price`/`unit` (e.g., "$0.89/lb"), iterate `unmatchedIngredients` to display ingredient name + "price not available" label (both no-match and out-of-stock are collapsed to this single label — FR-006), display `matchedCount`/`totalIngredients` count (e.g., "18 of 22 ingredients priced") (FR-004, FR-005, FR-006)
- [ ] T009 [P] [US2] Update `supabase/styles/components/store-comparison.module.scss` with per-ingredient breakdown styles (ingredient list, matched/unmatched rows, price label, unit label, match count badge)

**Checkpoint**: US1 + US2 both functional — per-ingredient breakdown visible within each store card.

---

## Phase 5: User Story 3 — Price Data Freshness Indicator (Priority: P3)

**Goal**: Each store entry shows a "prices as of [date]" timestamp; a staleness warning appears when data is 7+ days old; an unavailability message replaces the section when no data exists at all.

**Independent Test**: With the section visible, confirm a "prices as of" date is shown per store. Temporarily set `updated_at` to 8+ days ago in the DB, reload, and confirm the staleness warning appears. Verify the unavailability message renders when `isUnavailable` is true.

### Implementation for User Story 3

- [ ] T010 [P] [US3] Extend `supabase/components/StoreComparison.tsx` to: display `lastUpdated` as "prices as of [date and time]" (e.g., "Jun 3, 2026 at 2:14 PM") on each store card (FR-007); display a visible staleness warning alongside the timestamp when `isStale` is true (FR-008); render an unavailability message (e.g., "Pricing data unavailable — check back later") in place of store cards when `isUnavailable` is true (FR-009) (depends on T009)
- [ ] T011 [P] [US3] Update `supabase/styles/components/store-comparison.module.scss` with freshness indicator styles (timestamp label, staleness warning style, unavailability message style) (depends on T009)

**Checkpoint**: All three user stories functional — ranked stores, per-ingredient breakdown, freshness indicator + staleness/unavailability states.

---

## Phase 6: Sync — Refresh Prices from Kroger

**Purpose**: Build the user-initiated Kroger sync that populates real prices, surfaced via a "Refresh prices" button inside the StoreComparison section (FR-016, FR-017).

**Goal**: After this phase, clicking Refresh prices on the grocery page fetches current prices from the Kroger API for every active store with a `kroger_location_id`, upserts them, and re-renders the section with the new data.

**Independent Test**: Log in, navigate to `/groceries`, click Refresh prices, confirm prices populate within 60 seconds and the section re-renders with ranked stores. In an incognito window, confirm the Refresh button is absent.

- [ ] T012 [P] Add Kroger Developer API env vars to `supabase/.env.local`: `KROGER_CLIENT_ID`, `KROGER_CLIENT_SECRET`. Verify `SUPABASE_SERVICE_ROLE_KEY` is present (reused from the PDF import feature). Document the registration steps per quickstart.md Step 1.
- [ ] T013 [P] Create `supabase/lib/kroger.ts` exporting two functions: `getAccessToken()` (Client Credentials grant against `https://api.kroger.com/v1/connect/oauth2/token` with scope `product.compact`, returns the access token string; caller is responsible for caching within a single sync run), and `searchProduct(token, locationId, term)` that calls `GET https://api.kroger.com/v1/products?filter.term=<term>&filter.locationId=<id>&filter.limit=5` and returns the cheapest in-stock match as `{ price: number, size: string, unit: string }` or `null` if no in-stock match. Use plain `fetch`; no npm dependency.
- [ ] T014 Create `supabase/lib/sync-prices.ts`: declare a top-of-file `CANONICAL_INGREDIENTS: readonly string[]` constant with the initial seed list from data-model.md ("Initial `CANONICAL_INGREDIENTS` seed"). Export `syncPrices(): Promise<{ storesUpdated: number, rowsUpserted: number, errors: string[] }>` that fetches all `is_active && kroger_location_id IS NOT NULL` stores via the service-role Supabase client, calls `getAccessToken()` once, iterates each `(store, canonical)` pair calling `searchProduct`, and upserts results into `ingredient_prices` using the `UNIQUE(store_id, canonical_name)` constraint. Per-ingredient errors are pushed into `errors` and skipped; auth failure throws to the caller. (depends on T013)
- [ ] T015 Create `supabase/app/(utils)/groceries/actions.ts` with a `'use server'` directive at the top, exporting `refreshPricesAction(): Promise<{ ok: boolean, error?: string, summary?: { storesUpdated: number, rowsUpserted: number } }>`. The action re-checks the `x-user-authenticated` header via `headers()` and returns `{ ok: false, error: 'unauthenticated' }` if missing; otherwise calls `syncPrices()`, then `revalidatePath('/groceries')`, and returns the summary. Catches all errors and returns `{ ok: false, error: <message> }` rather than throwing. (depends on T014, FR-016, FR-017)
- [ ] T016 [P] Create `supabase/components/RefreshPricesButton.tsx` as a Client Component (`'use client'`): button that calls `refreshPricesAction` via `useTransition`. States: idle ("Refresh prices"), pending ("Refreshing…", disabled), error ("Refresh failed — try again" displayed near the button, button re-enabled). Imports the action from the actions.ts file. (depends on T015)
- [ ] T017 [P] Update `supabase/components/StoreComparison.tsx` to render `<RefreshPricesButton />` near the per-store "prices as of" timestamp when stores are visible; in the `isUnavailable` state, render the button below the unavailability message. The button must render for all authenticated views including the unavailability state (so the admin can trigger the first sync). (depends on T016)
- [ ] T018 [P] Update `supabase/styles/components/store-comparison.module.scss` with refresh button styles, pending/disabled state, and refresh error message styles.
- [ ] T019 Run quickstart.md Step 6 validation end-to-end: confirm unauthenticated users see no section or button (FR-001, SC-005), confirm authenticated users see loading then comparison (or unavailability message on a fresh install) **and that the comparison is visible within 10 seconds of page load (SC-001)**, click Refresh prices and confirm prices populate and the section re-renders (FR-016), verify staleness warning still works by backdating `updated_at` (FR-008), verify error path by temporarily breaking `KROGER_CLIENT_SECRET` and confirming the error message appears near the button without clearing existing prices (FR-017). Also navigate away from `/groceries` and back; confirm the previous comparison stays painted until the new render arrives, and that the updated comparison appears within 2 seconds of page load (FR-011). Verify SC-004: after the first sync, confirm that all 15 `CANONICAL_INGREDIENTS` items appear in at least one store's breakdown (matched or unmatched); at least 12 of 15 must be matched.

---

## Phase 7: Final Polish

- [ ] T020 [P] Sweep the codebase for the dropped artifacts: confirm `supabase/app/api/sync-prices/` does not exist and `CRON_SECRET` is not referenced anywhere in the project (these were planned in an earlier draft of this spec but are no longer used).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **blocks all user stories**
- **User Story 1 (Phase 3)**: Depends on Phase 2 — no dependency on US2 or US3
- **User Story 2 (Phase 4)**: Depends on US1 completion (needs StoreComparison.tsx and SCSS to exist)
- **User Story 3 (Phase 5)**: Depends on US2 completion (extends same component and SCSS)
- **Sync (Phase 6)**: Depends on US1 only (needs `StoreComparison.tsx` to mount the button); does NOT depend on US2 or US3, but in practice usually run after them. Required to populate real prices — without Phase 6, the section renders only the FR-009 unavailability state.
- **Final Polish (Phase 7)**: Depends on Phase 6.

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependencies on US2/US3
- **US2 (P2)**: Depends on US1 (T006, T007) — extends existing component
- **US3 (P3)**: Depends on US2 (T008, T009) — further extends the same component; `isStale`/`lastUpdated` data is already computed in T004 and typed in T003
- **Sync (Phase 6)**: Depends on US1 (T006) for the StoreComparison component to mount the Refresh button into. Can run in parallel with US2/US3 in principle, but typically sequenced last so the section is fully polished before exposing the sync to user clicks.

### Within Each User Story

- US1: T004 ∥ T005 → T006 → T007 (SCSS and lib can start together; component needs both; page needs component)
- US2: T008 ∥ T009 (component and SCSS can start together once US1 is done)
- US3: T010 ∥ T011 (component and SCSS can start together once US2 is done)

### Parallel Opportunities

```bash
# Phase 3 — US1: start T004 and T005 together
Task: "Implement lib/prices.ts normalizeIngredientName + computePriceComparison"
Task: "Create store-comparison.module.scss basic layout styles"

# Phase 4 — US2: start T008 and T009 together
Task: "Extend StoreComparison.tsx with per-ingredient breakdown"
Task: "Update store-comparison.module.scss with breakdown styles"

# Phase 5 — US3: start T010 and T011 together
Task: "Extend StoreComparison.tsx with freshness/staleness/unavailability display"
Task: "Update store-comparison.module.scss with freshness indicator styles"

# Phase 6 — Sync: start T012 and T013 together (env vars + Kroger client)
Task: "Add Kroger env vars to .env.local"
Task: "Create lib/kroger.ts (getAccessToken + searchProduct)"
# After T015 (the Server Action): T016, T017, T018 can run together
Task: "Create RefreshPricesButton.tsx Client Component"
Task: "Update StoreComparison.tsx to render the button"
Task: "Add refresh button + error styles to the SCSS module"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Apply migration with seed data
2. Complete Phase 2: Add TypeScript types (CRITICAL — blocks all stories)
3. Complete Phase 3: US1 — lib/prices.ts + StoreComparison.tsx + groceries/page.tsx + SCSS
4. **STOP and VALIDATE**: Run quickstart.md tests for US1 (auth gating, ranking, loading state)
5. Deploy/demo if ready

### Incremental Delivery

1. Phase 1 + 2 → DB schema + types ready
2. Phase 3 (US1) → Ranked comparison visible → validate → deploy as MVP (renders FR-009 unavailability until Phase 6)
3. Phase 4 (US2) → Breakdown visible → validate → deploy
4. Phase 5 (US3) → Freshness indicator → validate → deploy
5. Phase 6 → Kroger sync + Refresh button → real prices populate on click → validate end-to-end per quickstart.md Step 6
6. Phase 7 → Final sweep / cleanup

---

## Notes

- **[P] tasks** = different files, no blocking dependencies on incomplete tasks — can be dispatched as parallel agents
- **[Story] label** maps each task to its user story for traceability
- **No tests**: project uses ESLint only — manual validation per quickstart.md instead
- **Sync job included in this spec**: Phase 6 builds the Kroger sync end-to-end (no cron — admin clicks "Refresh prices" inside the section)
- **Commit after each phase checkpoint** to keep the branch in a working state
