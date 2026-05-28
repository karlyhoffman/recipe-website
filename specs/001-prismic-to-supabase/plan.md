# Implementation Plan: Migrate Recipe Backend from Prismic to Supabase

**Branch**: `specs/001-prismic-to-supabase` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-prismic-to-supabase/spec.md`

## Summary

Replace the 2026 site's placeholder data layer with a real Supabase (PostgreSQL) backend, migrating all recipe content from the 2023 Prismic-powered site. The 2026 site already has every page and a clean data access abstraction in place — only `lib/data.ts` and its dependencies change. The migration runs as a one-time script. No UI changes are required.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 16 (App Router), React 19, Node.js 20+

**Primary Dependencies**:
- New: `@supabase/ssr` (Supabase client for server components)
- Removed: `@prismicio/client`, `@prismicio/helpers`, `@prismicio/next`, `@prismicio/react` (from 2023 site, used only in migration script)

**Storage**: Supabase (PostgreSQL) — 8 tables; see `data-model.md`

**Testing**: None currently in the 2026 project; verification is manual spot-check per `quickstart.md`

**Target Platform**: Vercel (static generation at build time via `generateStaticParams`, ISR for dynamic pages)

**Project Type**: Web application (Next.js full-stack, server-component-first)

**Performance Goals**: Equivalent or better time-to-first-content vs. the current placeholder-data build; recipe detail pages statically generated

**Constraints**: All existing recipe URL slugs must be preserved; no UI changes visible to site visitors; `lib/data.ts` function signatures must remain unchanged

**Scale/Scope**: Personal recipe collection; estimated <500 recipes, <100 tags

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| User-Centered Content | ✅ Pass | All existing pages and routes preserved; migration is transparent to visitors |
| Maintainable Frontend Architecture | ✅ Pass | Only `lib/data.ts` implementation changes; UI components untouched; no new abstractions |
| Data Integrity & Content Reliability | ✅ Pass | Migration script verifies counts; `null`/`[]` returns handled gracefully in all pages |
| Quality through Documentation & Review | ✅ Pass | PR required; quickstart covers local verification; data-model and contracts documented |
| Performance and Reliability | ✅ Pass | Static generation preserved; `@supabase/ssr` replaces Prismic client — bundle impact is neutral |
| Incremental Delivery & Observability | ✅ Pass | Schema → migration → wiring → cleanup phases are independently deployable; 2023 site remains live as rollback |

**No violations. No Complexity Tracking entry needed.**

## Project Structure

### Documentation (this feature)

```text
specs/001-prismic-to-supabase/
├── plan.md              ← this file
├── spec.md
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── data-access.md   ← Phase 1 output
└── checklists/
    └── requirements.md
```

### Source Code

```text
2026-recipe-website/
├── lib/
│   ├── supabase.ts           ← NEW: Supabase client factory
│   ├── data.ts               ← CHANGE: replace placeholder impl with Supabase queries
│   └── placeholder-data.ts   ← DELETE: removed after migration verified
├── scripts/
│   └── migrate-from-prismic.ts  ← NEW: one-time migration script
├── supabase/
│   └── migrations/
│       └── 0001_initial_schema.sql  ← NEW: DDL for all 8 tables
└── .env.local                ← NEW: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_ANON_KEY

2023-recipe-website/          ← READ-ONLY: source for migration script only
```

**Structure Decision**: Single Next.js project (2026-recipe-website). The 2023 site is a read-only data source for the migration script and is not modified.

## Implementation Phases

### Phase 1: Schema & Infrastructure

1. Create Supabase project (if not already done)
2. Write DDL for all 8 tables per `data-model.md`; apply via Supabase SQL editor
3. Create `lib/supabase.ts` client factory
4. Add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_ANON_KEY` to `.env.local`
5. Install `@supabase/ssr`
6. Add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_ANON_KEY` to Vercel environment variables (Project Settings → Environment Variables) — required before the 2026 site can be deployed; a build without them will fail when the Supabase client is instantiated

**Verify**: `pnpm build` still passes (nothing calls Supabase yet; placeholder data still in use)

---

### Phase 2: Migration Script

1. Write `scripts/migrate-from-prismic.ts`:
   - **Truncate first**: delete all rows from all 8 tables in dependency order before inserting (makes re-runs safe after partial failures): `favorites_list`, `cook_next_list`, `related_recipes`, `recipe_tags`, `ingredient_entries`, `instruction_entries`, `recipes`, `tags`
   - Fetch all 4 tag types from Prismic → insert into `tags`
   - **Pass 1 — recipes**: fetch all recipes from Prismic with `fetchLinks`; insert into `recipes`, `ingredient_entries`, `instruction_entries`, `recipe_tags`; capture the returned Supabase UUIDs and build a `prismic_uid → supabase_uuid` map from the insert results
   - **Pass 2 — related recipes**: for each recipe's `related_recipes[]`, resolve both `recipe_id` and `related_recipe_id` from the uid→uuid map built in pass 1; insert into `related_recipes` (both recipe and its target must already exist in `recipes` for FK constraints to pass)
   - Fetch cook-next and favorites singletons → resolve recipe IDs from the uid→uuid map → insert into `cook_next_list`, `favorites_list`
   - Print count summary on completion
2. Run the script against the Supabase project
3. Verify counts match Prismic source

**Verify**: Recipe count, tag counts per category, and cook-next list length all match Prismic. Spot-check 5 recipes in the Supabase table editor.

---

### Phase 3: Wire Data Access Layer

Replace each function in `lib/data.ts` with Supabase queries per `contracts/data-access.md`:

1. `getRecipeByUid` — recipe + all child tables
2. `getAllRecipes` — for `generateStaticParams`; **before implementing**, grep for all call sites and confirm none expect a fully-hydrated `Recipe[]` — the Supabase implementation returns `RecipeSummary[]` (id, uid, title only), which is a narrowing of the current placeholder signature
3. Tag list functions (`getCuisineTags`, `getIngredientTags`, etc.)
4. Tag lookup functions (`getCuisineTagByUid`, etc.)
5. Tag → recipe functions (`getRecipesByCuisineTag`, etc.)
6. `getWeekdayRecipes`
7. `searchRecipes` — using `title_fts` tsvector column
8. Homepage curation functions (`getNextRecipes`, `getFavoriteRecipes`, `getRecentRecipes`, `getRandomRecipes`)
9. `getCookNextRecipes` — for Groceries page

**Verify**: Visit every page type in `pnpm dev`:
- Homepage (all 4 sections populated)
- `/recipes` overview
- A recipe detail page
- Each tag category overview and one tag detail page
- `/recipes/weekday`
- `/search?search=chicken`
- `/groceries`

---

### Phase 4: Cleanup

1. Delete `lib/placeholder-data.ts`
2. Remove `@prismicio/*` packages from 2026 site `package.json` (they were never a dependency — the migration script uses them from the 2023 site)
3. Confirm `pnpm build` passes with zero Prismic references in the 2026 site

**Verify**: `pnpm build` succeeds; no import errors; all static pages generated from Supabase data.
