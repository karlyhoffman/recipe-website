# Data Access Contracts

**Feature**: `001-prismic-to-supabase` | **Date**: 2026-05-27

The 2026 site's data access layer (`lib/data.ts`) is the interface contract between pages and the backend. Each function below must continue to satisfy its existing signature after the Supabase implementation replaces the placeholder data.

---

## Recipe Queries

### `getAllRecipes(): Promise<RecipeSummary[]>`
Returns a lightweight list of all recipes for route generation. Used by `generateStaticParams` to pre-build all recipe detail pages — callers only need `uid`. Fetching fully-hydrated recipes here would load every ingredient and instruction row on every build for no benefit.

**Backend query**: `SELECT id, uid, title FROM recipes` — no child table joins.

**Type note**: The return type narrows from `Recipe[]` to `RecipeSummary[]`; `generateStaticParams` only maps `uid`, so this is a safe change with no downstream impact.

---

### `getRecipeByUid(uid: string): Promise<Recipe | null>`
Returns a single fully-hydrated recipe by slug, or `null` if not found. Used by the recipe detail page.

**Backend query**: `recipes` where `uid = ?` joined with ingredient_entries (ordered by position), instruction_entries (ordered by position), recipe_tags → tags, related_recipes → recipes.

Returns `null` (triggering 404) if no row matches.

---

### `searchRecipes(term: string): Promise<RecipeSummary[]>`
Returns matching recipes for a search term. Returns `[]` for empty input without querying.

**Backend query**: `recipes` where `title_fts @@ websearch_to_tsquery('english', term)`, returning `id`, `uid`, `title` only.

---

### `getWeekdayRecipes(): Promise<RecipeSummary[]>`
Returns all recipes flagged as weekday meals.

**Backend query**: `recipes` where `weekday = true`, returning `id`, `uid`, `title`.

---

## Tag List Queries

All return `Tag[]` (id, uid, name), ordered alphabetically by `name`.

### `getCuisineTags(): Promise<Tag[]>`
**Backend query**: `tags` where `category = 'cuisine'` order by `name asc`.

### `getIngredientTags(): Promise<Tag[]>`
**Backend query**: `tags` where `category = 'ingredient'` order by `name asc`.

### `getTypeTags(): Promise<Tag[]>`
**Backend query**: `tags` where `category = 'type'` order by `name asc`.

### `getSeasonTags(): Promise<Tag[]>`
**Backend query**: `tags` where `category = 'season'` order by `name asc`.

---

## Tag Lookup Queries

All return a single `Tag | null`. Used by `generateStaticParams` for tag detail pages.

### `getCuisineTagByUid(uid: string): Promise<Tag | null>`
### `getIngredientTagByUid(uid: string): Promise<Tag | null>`
### `getTypeTagByUid(uid: string): Promise<Tag | null>`
### `getSeasonTagByUid(uid: string): Promise<Tag | null>`

**Backend query (each)**: `tags` where `uid = ?` and `category = '[category]'`. Returns `null` if not found (triggers 404).

---

## Tag → Recipe Queries

All return `RecipeSummary[]` (id, uid, title) — the recipes associated with a given tag slug.

### `getRecipesByCuisineTag(uid: string): Promise<RecipeSummary[]>`
### `getRecipesByIngredientTag(uid: string): Promise<RecipeSummary[]>`
### `getRecipesByTypeTag(uid: string): Promise<RecipeSummary[]>`
### `getRecipesBySeasonTag(uid: string): Promise<RecipeSummary[]>`

**Backend query (each)**: `recipe_tags` join `tags` (where `tags.uid = ?` and `tags.category = '[category]'`) join `recipes`, returning recipe `id`, `uid`, `title`.

---

## Homepage Curation Queries

### `getNextRecipes(): Promise<RecipeSummary[]>`
Returns recipes from `cook_next_list` ordered by `position asc`.

### `getFavoriteRecipes(): Promise<RecipeSummary[]>`
Returns recipes from `favorites_list` ordered by `position asc`.

### `getRecentRecipes(): Promise<RecipeSummary[]>`
Returns the 10 most recently added recipes ordered by `created_at desc`.

**Backend query**: `recipes` order by `created_at desc` limit 10, returning `id`, `uid`, `title`.

### `getRandomRecipes(): Promise<RecipeSummary[]>`
Returns a random selection of recipes for "Ideas for Next Week."

**Backend query**: `recipes` order by `random()` limit 10, returning `id`, `uid`, `title`.

---

## Grocery List Query

### `getCookNextRecipes(): Promise<Recipe[]>`
Returns fully-hydrated recipes from `cook_next_list` ordered by `position asc`. Used by the Groceries page to derive the consolidated ingredient list.

**Backend query**: Same as `getRecipeByUid` but for all cook-next recipe IDs, joined with ingredient_entries (including aisle).

---

## Error Handling Contract

- All functions return `null` or `[]` on missing data — never throw to the caller.
- Pages that receive `null` call `notFound()` to render the 404 page.
- Pages that receive `[]` render an empty state.
- Any database error should be caught inside the data function and return the appropriate empty value, not propagate.
