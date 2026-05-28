---

description: "Task list template for feature implementation"
---

# Tasks: Migrate Recipe Backend from Prismic to Supabase

**Input**: Design documents from `/specs/001-prismic-to-supabase/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/data-access.md ✅, quickstart.md ✅

**Tests**: No test tasks generated — the spec explicitly states no tests exist in the 2026 project; verification is manual spot-check per quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (independent functions, no shared state conflicts)
- **[Story]**: Which user story this task belongs to (US1–US6)
- Exact file paths included in all descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies, create environment config, and wire the Supabase client factory. No Supabase queries are made yet — placeholder data remains active through this phase.

- [X] T001 Install `@supabase/ssr` in `2026-recipe-website/package.json` via `pnpm add @supabase/ssr` from the `2026-recipe-website/` directory
- [X] T002 Create `2026-recipe-website/.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_ANON_KEY` (values from Supabase dashboard → Project Settings → API)
- [ ] T002b Add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_ANON_KEY` to Vercel Project Settings → Environment Variables (all environments: Production, Preview, Development) — required before any Vercel deploy; a build without them fails at Supabase client instantiation
- [X] T003 Create `2026-recipe-website/lib/supabase.ts` with `createClient()` factory using `createServerClient` from `@supabase/ssr`, reading `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_ANON_KEY`, with `cookies: { getAll: () => [] }` (no auth sessions needed)

**Checkpoint**: Run `pnpm build` from `2026-recipe-website/` — must pass. Nothing calls Supabase yet; placeholder data still in use.

---

## Phase 2: Foundational (Blocking Prerequisite — Database Schema)

**Purpose**: Create the Supabase database schema. This must be applied before running the migration script or wiring any data access functions.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete — the migration script and all data functions depend on these tables existing.

- [X] T004 Write DDL for all 8 tables in `2026-recipe-website/supabase/migrations/0001_initial_schema.sql`: `recipes` (with `title_fts` generated tsvector column and GIN index, `created_at` index, uuid pk), `tags` (with `(category, name)` compound index and CHECK constraint on category values), `recipe_tags` (composite PK, FK cascades, index on `tag_id`), `ingredient_entries` (with `(recipe_id, position)` compound index, CHECK on type, CHECK on aisle values), `instruction_entries` (with `(recipe_id, position)` compound index, CHECK on type), `related_recipes` (composite PK, dual FK cascades, index on `related_recipe_id`), `cook_next_list` (recipe_id PK, FK cascade), `favorites_list` (recipe_id PK, FK cascade) — include all RLS `ENABLE ROW LEVEL SECURITY` statements and `CREATE POLICY "public read"` SELECT policies for the `anon` role on every table, as specified in `data-model.md`
- [X] T005 Apply `0001_initial_schema.sql` to the Supabase project via the SQL editor (or `supabase db query`) and confirm all 8 tables are created with correct columns, indexes, and RLS policies active

**Checkpoint**: All 8 tables visible in Supabase table editor with RLS enabled. Foundation ready.

---

## Phase 3: User Story 6 — Data Migration (Priority: P1, Prerequisite)

**Goal**: Migrate all Prismic content (recipes, tags, curated lists) into Supabase with full fidelity, preserving all slugs, ordering, and field values.

**Independent Test**: After running the script, compare recipe count and each tag category count in Supabase against the Prismic source. Spot-check 5+ recipes across different types for field accuracy.

- [X] T006 [US6] Create `2026-recipe-website/scripts/migrate-from-prismic.ts`: initialize a Prismic client (using `PRISMIC_API_URL` and `PRISMIC_ACCESS_TOKEN` env vars from the 2023 site's `.env`) and a Supabase client (imported from `../lib/supabase`); add a typed in-memory map to hold `tagUidToId` and `recipeUidToId` for resolving foreign keys during later steps; **truncate all 8 tables first** in FK-safe dependency order (`favorites_list`, `cook_next_list`, `related_recipes`, `recipe_tags`, `ingredient_entries`, `instruction_entries`, `recipes`, `tags`) so the script is safe to re-run after a partial failure
- [X] T007 [US6] Add tag migration to `2026-recipe-website/scripts/migrate-from-prismic.ts`: use `client.getAllByType()` for each of `ingredient_tag`, `cuisine_tag`, `type_tag`, `season_tag`; insert into `tags` table with `uid`, `name` (from the corresponding `.data.*_tag` text field), and `category` (`ingredient`/`cuisine`/`type`/`season`); populate `tagUidToId` map from returned ids
- [X] T008 [US6] Add recipe row migration to `2026-recipe-website/scripts/migrate-from-prismic.ts`: fetch all `recipe` documents with `fetchLinks` for all tag types and related recipes; insert into `recipes` with `uid`, `title` (via `asText()`), `prep_minutes`, `total_minutes`, `servings`, `notes` (plain text via `asText()`), `source` (see URL extraction below), `weekday` (convert `weekday_tag === 'Yes'` → `true`, all else → `false`), and `created_at` explicitly set from `first_publication_date`; populate `recipeUidToId` map. **Source URL extraction**: `data.source` is a RichText field — call `asText()` for the text, then inspect `data.source[0]?.spans` for an entry with `type === 'hyperlink'`; if found, store the field as `[link text](url)` (using the span's `data.url`); if not found, store plain `asText()` result; do NOT use `asText()` alone as it silently drops hyperlink URLs
- [X] T009 [US6] Add ingredient entries migration to `2026-recipe-website/scripts/migrate-from-prismic.ts`: for each recipe, iterate `data.ingredient_slices[]`; for `ingredient_heading` slices set `type = 'heading'`, `name = asText()`; for `ingredient` slices apply the bold-span parsing logic from `data-model.md` (one bold span → split `amount`/`name`/`preparation`; zero or multiple bold spans → full text in `name`); insert all rows into `ingredient_entries` with 0-based `position` and the recipe's `id`
- [X] T010 [US6] Add instruction entries migration to `2026-recipe-website/scripts/migrate-from-prismic.ts`: for each recipe, iterate `data.body[]`; for `instruction_heading` slices set `type = 'heading'`, `text = asText()`; for `recipe_instruction` slices convert Prismic StructuredText bold spans to `**text**` markdown format (do NOT use plain `asText()` which drops bold); insert all rows into `instruction_entries` with 0-based `position`
- [X] T011 [US6] Add recipe_tags migration to `2026-recipe-website/scripts/migrate-from-prismic.ts`: for each recipe, iterate all four tag arrays (`main_ingredient_tags`, `cuisine_tags`, `type_tags`, `season_tags`); resolve each tag's uuid from `tagUidToId`; insert into `recipe_tags` with `recipe_id` and `tag_id`
- [X] T012 [US6] Add related_recipes migration to `2026-recipe-website/scripts/migrate-from-prismic.ts`: for each recipe, iterate `data.related_recipes[]`; resolve each related recipe's uuid from `recipeUidToId`; insert into `related_recipes` with `recipe_id`, `related_recipe_id`, and 0-based `position`
- [X] T013 [US6] Add curated lists migration to `2026-recipe-website/scripts/migrate-from-prismic.ts`: fetch `cook_next_list` singleton with `fetchLinks: ['recipe.uid']`; insert ordered rows into `cook_next_list`; fetch `favorites_list` singleton; insert ordered rows into `favorites_list`; add a final count summary that prints total recipes, tags per category, and list lengths for manual verification
- [X] T014 [US6] Run `2026-recipe-website/scripts/migrate-from-prismic.ts` against the Supabase project; verify printed counts match Prismic source; spot-check 5 recipes in the Supabase table editor for field accuracy and slug preservation

**Checkpoint**: Recipe count, tag counts per category, and cook-next list length all match Prismic. Existing slugs present. Migration complete.

---

## Phase 4: User Story 1 — View Recipe Detail Pages (Priority: P1) 🎯 MVP

**Goal**: Replace placeholder implementations so that recipe detail pages render fully from Supabase data, including all child records.

**Independent Test**: Run `pnpm dev`, visit any recipe URL that existed in Prismic (e.g. `/recipes/some-slug`), and confirm the full recipe renders with title, timing, servings, notes, source, ingredients, instructions, tags, and related recipes.

- [X] T015 [US1] Implement `getAllRecipes()` in `2026-recipe-website/lib/data.ts`: replace placeholder with Supabase query `SELECT id, uid, title FROM recipes` (no joins); return `RecipeSummary[]`; catch errors and return `[]`. **⚠️ Return type change**: the current signature returns `Promise<Recipe[]>` — change it to `Promise<RecipeSummary[]>`. Before implementing, grep for all callers of `getAllRecipes()` in the 2026 site and confirm none access fields beyond `id`, `uid`, and `title`
- [X] T016 [US1] Implement `getRecipeByUid(uid: string)` in `2026-recipe-website/lib/data.ts`: replace placeholder with Supabase query fetching the recipe row plus `ingredient_entries` (ordered by `position`), `instruction_entries` (ordered by `position`), `recipe_tags → tags` (all four categories), and `related_recipes → recipes` (ordered by `position`); map rows to the `Recipe` TypeScript type; return `null` if not found; catch errors and return `null`

**Checkpoint**: Recipe detail pages load from Supabase. `generateStaticParams` builds all recipe routes. Manual spot-check of 3 recipes passes. Visit `/recipes/nonexistent-slug` and confirm the 404 page renders — `notFound()` is already wired at `app/recipes/[recipe]/page.tsx:24`. Verify SC-004: compare page load feel against the live 2023 Prismic site in a browser side-by-side; static generation is preserved so this should pass naturally.

---

## Phase 5: User Story 2 — Browse Recipes by Category Tag (Priority: P2)

**Goal**: Replace placeholder implementations for all tag list, tag lookup, and tag→recipe functions so that tag browsing pages render from Supabase data.

**Independent Test**: Navigate to `/recipes/ingredients`, confirm all ingredient tags are listed alphabetically; click a tag and confirm the correct recipe list appears.

- [X] T017 [P] [US2] Implement `getCuisineTags()` in `2026-recipe-website/lib/data.ts`: `SELECT id, uid, name FROM tags WHERE category = 'cuisine' ORDER BY name ASC`; return `Tag[]`; catch errors and return `[]`
- [X] T018 [P] [US2] Implement `getIngredientTags()` in `2026-recipe-website/lib/data.ts`: `SELECT id, uid, name FROM tags WHERE category = 'ingredient' ORDER BY name ASC`; return `Tag[]`; catch errors and return `[]`
- [X] T019 [P] [US2] Implement `getTypeTags()` in `2026-recipe-website/lib/data.ts`: `SELECT id, uid, name FROM tags WHERE category = 'type' ORDER BY name ASC`; return `Tag[]`; catch errors and return `[]` — the `'type'` category value corresponds to "dish type" in the spec/UI and is served at `/recipes/dish-types`
- [ ] T020 [P] [US2] Implement `getSeasonTags()` in `2026-recipe-website/lib/data.ts`: `SELECT id, uid, name FROM tags WHERE category = 'season' ORDER BY name ASC`; return `Tag[]`; catch errors and return `[]`
- [ ] T021 [P] [US2] Implement `getCuisineTagByUid(uid: string)` in `2026-recipe-website/lib/data.ts`: query `tags` where `uid = uid AND category = 'cuisine'`; return `Tag | null`; catch errors and return `null`
- [ ] T022 [P] [US2] Implement `getIngredientTagByUid(uid: string)` in `2026-recipe-website/lib/data.ts`: query `tags` where `uid = uid AND category = 'ingredient'`; return `Tag | null`; catch errors and return `null`
- [ ] T023 [P] [US2] Implement `getTypeTagByUid(uid: string)` in `2026-recipe-website/lib/data.ts`: query `tags` where `uid = uid AND category = 'type'`; return `Tag | null`; catch errors and return `null`
- [ ] T024 [P] [US2] Implement `getSeasonTagByUid(uid: string)` in `2026-recipe-website/lib/data.ts`: query `tags` where `uid = uid AND category = 'season'`; return `Tag | null`; catch errors and return `null`
- [X] T025 [P] [US2] Implement `getRecipesByCuisineTag(uid: string)` in `2026-recipe-website/lib/data.ts`: join `recipe_tags → tags` (where `tags.uid = uid AND tags.category = 'cuisine'`) → `recipes`; return `RecipeSummary[]`; catch errors and return `[]`
- [X] T026 [P] [US2] Implement `getRecipesByIngredientTag(uid: string)` in `2026-recipe-website/lib/data.ts`: join `recipe_tags → tags` (where `tags.uid = uid AND tags.category = 'ingredient'`) → `recipes`; return `RecipeSummary[]`; catch errors and return `[]`
- [X] T027 [P] [US2] Implement `getRecipesByTypeTag(uid: string)` in `2026-recipe-website/lib/data.ts`: join `recipe_tags → tags` (where `tags.uid = uid AND tags.category = 'type'`) → `recipes`; return `RecipeSummary[]`; catch errors and return `[]`
- [X] T028 [P] [US2] Implement `getRecipesBySeasonTag(uid: string)` in `2026-recipe-website/lib/data.ts`: join `recipe_tags → tags` (where `tags.uid = uid AND tags.category = 'season'`) → `recipes`; return `RecipeSummary[]`; catch errors and return `[]`
- [X] T029 [US2] Implement `getWeekdayRecipes()` in `2026-recipe-website/lib/data.ts`: `SELECT id, uid, title FROM recipes WHERE weekday = true`; return `RecipeSummary[]`; catch errors and return `[]`

**Checkpoint**: All tag overview pages (`/recipes/ingredients`, `/recipes/cuisines`, `/recipes/dish-types`, `/recipes/seasons`) and one tag detail page per category load correctly from Supabase. `/recipes/weekday` lists correct recipes. Verify 404 for a nonexistent tag slug — `notFound()` is already wired in all tag detail pages.

---

## Phase 6: User Story 3 — Search Recipes (Priority: P3)

**Goal**: Replace the placeholder `searchRecipes` implementation so that the search page returns results from Supabase's full-text search index.

**Independent Test**: Run `pnpm dev`, navigate to `/search?search=chicken`, and confirm results appear from Supabase data.

- [ ] T030 [US3] Implement `searchRecipes(term: string)` in `2026-recipe-website/lib/data.ts`: return `[]` immediately if `term` is empty; otherwise query `recipes` using `.textSearch('title_fts', term)` (uses `websearch_to_tsquery` internally), selecting `id, uid, title`; return `RecipeSummary[]`; catch errors and return `[]`

**Checkpoint**: Search for a recipe title keyword returns correct results; empty search returns `[]` without querying.

---

## Phase 7: User Story 4 — Homepage Curations (Priority: P4)

**Goal**: Replace all four placeholder homepage curation functions so that the homepage sections pull live data from Supabase.

**Independent Test**: Run `pnpm dev`, visit the homepage, and confirm all four sections ("Cook Next," "Current Favorites," "Recently Added," "Ideas for Next Week") display recipes from Supabase.

- [ ] T031 [P] [US4] Implement `getNextRecipes()` in `2026-recipe-website/lib/data.ts`: join `cook_next_list → recipes` ordered by `cook_next_list.position ASC`; return `RecipeSummary[]`; catch errors and return `[]`
- [ ] T032 [P] [US4] Implement `getFavoriteRecipes()` in `2026-recipe-website/lib/data.ts`: join `favorites_list → recipes` ordered by `favorites_list.position ASC`; return `RecipeSummary[]`; catch errors and return `[]`
- [ ] T033 [P] [US4] Implement `getRecentRecipes()` in `2026-recipe-website/lib/data.ts`: `SELECT id, uid, title FROM recipes ORDER BY created_at DESC LIMIT 10`; return `RecipeSummary[]`; catch errors and return `[]` — `LIMIT 10` is a tunable default
- [ ] T034 [P] [US4] Implement `getRandomRecipes()` in `2026-recipe-website/lib/data.ts`: `SELECT id, uid, title FROM recipes ORDER BY random() LIMIT 10`; return `RecipeSummary[]`; catch errors and return `[]` — `LIMIT 10` is a tunable default; `ORDER BY random()` is fine at <500 recipes

**Checkpoint**: All four homepage sections populated from Supabase data. Cook-next and favorites sections match the editorial curation in the Supabase table.

---

## Phase 8: User Story 5 — Grocery List from Cook-Next Recipes (Priority: P5)

**Goal**: Replace the placeholder `getCookNextRecipes` implementation so that the Groceries page derives its consolidated ingredient list from cook-next recipes stored in Supabase, including aisle data.

**Independent Test**: Visit `/groceries` and confirm ingredients are grouped by aisle, matching the cook-next recipes in Supabase.

- [X] T035 [US5] Implement `getCookNextRecipes()` in `2026-recipe-website/lib/data.ts`: join `cook_next_list → recipes` (ordered by `position ASC`) with full `ingredient_entries` for each recipe (ordered by `position ASC`, including `aisle`); return `Recipe[]` fully hydrated; catch errors and return `[]`

**Checkpoint**: Groceries page shows ingredients grouped by aisle sourced from cook-next recipes. Duplicates are flagged as expected by the existing UI.

---

## Phase 9: Polish & Cleanup

**Purpose**: Remove all placeholder data and verify the build is clean.

- [X] T036 Delete `2026-recipe-website/lib/placeholder-data.ts` and remove its import from `2026-recipe-website/lib/data.ts`
- [X] T037 Confirm `pnpm build` passes from `2026-recipe-website/` with no import errors, no Prismic references, and all static pages generated from Supabase data
- [X] T038 Run `pnpm typecheck && pnpm lint` from `2026-recipe-website/` and resolve all errors — required by constitution before opening a PR
- [X] T039 Verify SC-004: open a recipe detail page in `pnpm dev` and compare load feel against the live 2023 site; confirm `pnpm build` output shows recipe pages are statically generated (routes appear without the `ƒ` dynamic marker in build output)
- [X] T040 Update `README.md` (or create `.env.example`) to document the required environment variables `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_ANON_KEY` and where to obtain them — required by constitution (Principle 4) for any change that affects developer setup

**Checkpoint**: `pnpm build` succeeds; TypeScript and ESLint pass. Zero references to `placeholder-data` or `@prismicio/*` in the 2026 site. All recipe and tag routes statically generated. SC-004 performance verified. README updated with env var documentation. Rollback if needed: revert `lib/data.ts` to restore placeholder data — the 2023 Prismic site remains live throughout.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001–T003) — BLOCKS all user story work
- **US6 Migration (Phase 3)**: Depends on Foundational (T004–T005) — BLOCKS all data-access wiring
- **US1 (Phase 4)**: Depends on US6 migration complete (T006–T014) — MVP start
- **US2 (Phase 5)**: Depends on US6 migration complete — can run in parallel with US1
- **US3 (Phase 6)**: Depends on US6 migration complete — can run after or in parallel with US1/US2
- **US4 (Phase 7)**: Depends on US6 migration complete (cook-next and favorites lists must be populated)
- **US5 (Phase 8)**: Depends on US6 migration complete and cook-next list populated
- **Polish (Phase 9)**: Depends on all user stories verified in `pnpm dev`

### User Story Dependencies

- **US6 (P1, Prerequisite)**: Migration script — no story dependencies, only schema (Phase 2)
- **US1 (P1)**: Can start after US6 completes — no dependencies on other stories
- **US2 (P2)**: Can start after US6 completes — no dependencies on US1
- **US3 (P3)**: Can start after US6 completes — no dependencies on US1/US2
- **US4 (P4)**: Can start after US6 completes (curated list data must exist) — no dependencies on US1–US3
- **US5 (P5)**: Can start after US6 completes — no dependencies on US1–US4

### Within Each User Story

- All `lib/data.ts` functions within a story are independent of each other (same file, separate exported functions)
- Tag list, lookup, and tag→recipe function groups within US2 can be implemented in any order
- Homepage curation functions within US4 can be implemented in any order

### Parallel Opportunities

- T001, T002, T003 (Setup) — all independent, run together
- T017–T020 (tag list functions) — four independent functions, [P] marked
- T021–T024 (tag lookup functions) — four independent functions, [P] marked
- T025–T028 (tag→recipe functions) — four independent functions, [P] marked
- T031–T034 (homepage curation functions) — four independent functions, [P] marked
- US1 through US5 phases can all start in parallel once Phase 3 (US6 migration) is complete

---

## Parallel Example: Phase 5 (Tag Functions)

```bash
# All 4 tag list functions are independent — implement together:
Task T017: getCuisineTags()
Task T018: getIngredientTags()
Task T019: getTypeTags()
Task T020: getSeasonTags()

# Then all 4 tag lookup functions:
Task T021: getCuisineTagByUid()
Task T022: getIngredientTagByUid()
Task T023: getTypeTagByUid()
Task T024: getSeasonTagByUid()
```

---

## Implementation Strategy

### MVP First (US6 + US1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — apply schema to Supabase
3. Complete Phase 3: US6 — run migration script, verify counts
4. Complete Phase 4: US1 — wire `getAllRecipes` and `getRecipeByUid`
5. **STOP and VALIDATE**: Visit recipe detail pages in `pnpm dev` — full content renders from Supabase
6. This is the minimum viable migration: the site's core content unit works

### Incremental Delivery

1. Setup + Foundational → Schema ready
2. US6 migration → Data in Supabase ✓
3. US1 → Recipe detail pages live ✓
4. US2 → Tag browsing live ✓
5. US3 → Search live ✓
6. US4 → Homepage curations live ✓
7. US5 → Groceries page live ✓
8. Polish → Clean build, placeholder removed ✓

---

## Notes

- [P] tasks = logically independent functions; can be dispatched as parallel agents or implemented sequentially in any order
- [Story] label maps each task to a specific user story for traceability
- No automated tests — verification is manual spot-check per `quickstart.md`
- The 2023 site remains untouched throughout; rollback is always available by reverting `lib/data.ts`
- `created_at` on recipes MUST be set explicitly from Prismic `first_publication_date` — using the column default breaks `getRecentRecipes()` ordering
- Bold formatting in instruction entries MUST use `**text**` markdown, not plain `asText()` — the 2026 `InstructionSliceRenderer` depends on this
