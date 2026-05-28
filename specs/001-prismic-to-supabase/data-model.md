# Data Model: Migrate Recipe Backend from Prismic to Supabase

**Feature**: `001-prismic-to-supabase` | **Date**: 2026-05-27

---

## Entity Overview

```
recipes
  ├── ingredient_entries   (ordered, child of recipe)
  ├── instruction_entries  (ordered, child of recipe)
  ├── recipe_tags          (junction → tags)
  └── related_recipes      (self-referencing junction)

tags
  └── recipe_tags

cook_next_list             (ordered, references recipes)
favorites_list             (ordered, references recipes)
```

---

## Table Definitions

### `recipes`

The primary content record.

| Column         | Type      | Nullable | Notes                        |
|----------------|-----------|----------|------------------------------|
| `id`           | uuid      | no       | Primary key, generated       |
| `uid`          | text      | no       | Unique URL slug              |
| `title`        | text      | no       |                              |
| `prep_minutes` | integer   | yes      |                              |
| `total_minutes`| integer   | yes      |                              |
| `servings`     | integer   | yes      |                              |
| `notes`        | text      | yes      | Plain text                   |
| `source`       | text      | yes      | Plain text, may contain URL  |
| `weekday`      | boolean   | no       | Default false                |
| `title_fts`    | tsvector  | no       | `GENERATED ALWAYS AS (to_tsvector('english', title)) STORED` |
| `created_at`   | timestamptz | no     | Set from Prismic `first_publication_date`; drives "Recently Added" ordering |

**Constraints**: `uid` is unique.
**Indexes**:
- GIN index on `title_fts` for full-text search
- B-tree index on `created_at DESC` for `getRecentRecipes()` (reads 10 rows from the front without scanning the full table)

**Migration note**: `created_at` must be explicitly set to each recipe's `first_publication_date` from Prismic. Do not rely on the column default — it would stamp every migrated row with the migration timestamp and break `getRecentRecipes()` ordering.

---

### `tags`

All tag categories in one table, discriminated by `category`.

| Column     | Type | Nullable | Notes                                            |
|------------|------|----------|--------------------------------------------------|
| `id`       | uuid | no       | Primary key, generated                           |
| `uid`      | text | no       | Unique URL slug                                  |
| `name`     | text | no       | Display name                                     |
| `category` | text | no       | One of: `ingredient`, `cuisine`, `type`, `season`|

**Constraints**: `uid` is unique. `category` is constrained to the four valid values.
**Index**: Compound B-tree index on `(category, name)` — covers both the `WHERE category = ?` filter and the `ORDER BY name ASC` sort used by all tag list queries in a single pass.

---

### `recipe_tags`

Junction table linking recipes to tags (many-to-many).

| Column      | Type | Nullable | Notes                    |
|-------------|------|----------|--------------------------|
| `recipe_id` | uuid | no       | FK → recipes.id          |
| `tag_id`    | uuid | no       | FK → tags.id             |

**Constraints**: Primary key is `(recipe_id, tag_id)`. FK constraints are `ON DELETE CASCADE`.
**Index**: B-tree index on `tag_id` — the composite PK index has `recipe_id` as the leading column and cannot efficiently support the "all recipes for a given tag" lookup direction needed by `getRecipesByCuisineTag` and related queries.

---

### `ingredient_entries`

Ordered ingredient list for a recipe. Each row is either a section heading or an ingredient.

| Column        | Type    | Nullable | Notes                             |
|---------------|---------|----------|-----------------------------------|
| `id`          | uuid    | no       | Primary key, generated            |
| `recipe_id`   | uuid    | no       | FK → recipes.id                   |
| `position`    | integer | no       | 0-based, defines display order    |
| `type`        | text    | no       | `heading` or `ingredient`         |
| `name`        | text    | no       | Heading text or ingredient name   |
| `amount`      | text    | yes      | Quantity/unit (ingredient only)   |
| `preparation` | text    | yes      | e.g. "diced" (ingredient only)    |
| `aisle`       | text    | yes      | Grocery aisle grouping; must match a value in `AISLE_ORDER` |

**Constraints**: `type` constrained to `heading` or `ingredient`. FK on `recipe_id` is `ON DELETE CASCADE`.
**Index**: Compound B-tree index on `(recipe_id, position)` — every recipe page load fetches all ingredients for a recipe ordered by position; this index satisfies both the filter and the sort in a single pass without a separate sort step.

**Canonical `aisle` values** (must match the 2026 groceries page `AISLE_ORDER` exactly):
`Beer and Wine`, `Produce`, `Deli`, `Bread`, `Seafood`, `Meat`, `Cheese`, `World Aisle`, `Pasta`, `Condiments`, `Soups & Canned Goods`, `Spices`, `Baking`, `Cereal`, `Chips`, `Soda`, `Frozen`, `Dairy`.
Ingredients with no aisle, or with a value not in this list, are grouped under "Other" on the groceries page.

**Migration note (Prismic parsing)**: In Prismic, each ingredient slice stores amount, name, and preparation in a single StructuredText field. The ingredient name is marked with bold formatting. The migration script extracts fields based on how many bold spans are present:

- **Exactly one bold span** — split into structured fields:
  - `amount` — plain text *before* the bold span, trimmed; null if empty
  - `name` — text content of the bold span
  - `preparation` — plain text *after* the bold span, trimmed with any leading comma and whitespace stripped; null if empty

- **Zero or multiple bold spans** — treat as an unstructured ingredient; store the full plain text (`asText()`) in `name`, set `amount` and `preparation` to null. Example: `"Cilantro leaves with tender stems and Tortilla Chips (for serving)"` (two bold spans in Prismic) → stored entirely in `name`.

The render format for a structured ingredient is: `${amount} <strong>${name}</strong>, ${preparation}` (omitting the amount or preparation segment when null).

For `ingredient_heading` slices, `type` is set to `heading`, `name` is the heading text, and `amount`/`preparation`/`aisle` are null.

---

### `instruction_entries`

Ordered instruction list for a recipe. Each row is either a section heading or an instruction step.

| Column      | Type    | Nullable | Notes                             |
|-------------|---------|----------|-----------------------------------|
| `id`        | uuid    | no       | Primary key, generated            |
| `recipe_id` | uuid    | no       | FK → recipes.id                   |
| `position`  | integer | no       | 0-based, defines display order    |
| `type`      | text    | no       | `heading` or `instruction`        |
| `text`      | text    | no       | Content of the step or heading    |

**Constraints**: `type` constrained to `heading` or `instruction`. FK on `recipe_id` is `ON DELETE CASCADE`.
**Index**: Compound B-tree index on `(recipe_id, position)` — same rationale as `ingredient_entries`.

**Migration note (bold formatting)**: The 2026 `InstructionSliceRenderer` uses a `withBold()` parser that looks for `**text**` markdown markers to produce `<strong>` tags. The migration script must convert Prismic's StructuredText bold spans to this format. Using plain `asText()` on instruction content silently drops all bold formatting. For `instruction_heading` slices, plain `asText()` is correct (headings have no bold).

---

### `related_recipes`

Ordered list of related recipes for a given recipe (self-referencing).

| Column              | Type    | Nullable | Notes                          |
|---------------------|---------|----------|--------------------------------|
| `recipe_id`         | uuid    | no       | FK → recipes.id (source)       |
| `related_recipe_id` | uuid    | no       | FK → recipes.id (target)       |
| `position`          | integer | no       | 0-based, defines display order |

**Constraints**: Primary key is `(recipe_id, related_recipe_id)`. Both FK constraints are `ON DELETE CASCADE` — removing a recipe automatically removes it as both a source and a target of related-recipe links.

---

### `cook_next_list`

Ordered editorial curation of recipes to cook next. Drives both the homepage "Cook Next" section and the Groceries ingredient list.

| Column      | Type    | Nullable | Notes                          |
|-------------|---------|----------|--------------------------------|
| `id`        | uuid    | no       | Primary key, generated         |
| `recipe_id` | uuid    | no       | FK → recipes.id                |
| `position`  | integer | no       | 0-based, defines display order |

**Constraints**: `UNIQUE(recipe_id)` — a recipe may appear only once in the list. FK on `recipe_id` is `ON DELETE CASCADE`.

---

### `favorites_list`

Ordered editorial curation of current favorite recipes. Drives the homepage "Current Favorites" section.

| Column      | Type    | Nullable | Notes                          |
|-------------|---------|----------|--------------------------------|
| `id`        | uuid    | no       | Primary key, generated         |
| `recipe_id` | uuid    | no       | FK → recipes.id                |
| `position`  | integer | no       | 0-based, defines display order |

**Constraints**: `UNIQUE(recipe_id)` — a recipe may appear only once in the list. FK on `recipe_id` is `ON DELETE CASCADE`.

---

## Mapping: Prismic → Data Model

| Prismic field                         | Table / Column                              |
|---------------------------------------|---------------------------------------------|
| `recipe.uid`                          | `recipes.uid`                               |
| `recipe.data.title` (RichText)        | `recipes.title` (plain text via `asText`)   |
| `recipe.data.minutes_prep`            | `recipes.prep_minutes`                      |
| `recipe.data.minutes_total`           | `recipes.total_minutes`                     |
| `recipe.data.servings`                | `recipes.servings`                          |
| `recipe.data.recipe_notes` (RichText) | `recipes.notes` (plain text)               |
| `recipe.data.source` (RichText)       | `recipes.source` (plain text + URL)        |
| `recipe.data.weekday_tag` (`'Yes'`) ¹  | `recipes.weekday = true`                   |
| `recipe.first_publication_date`       | `recipes.created_at`                        |
| `recipe.data.ingredient_slices[]`     | `ingredient_entries` rows (by position)     |
| `recipe.data.body[]`                  | `instruction_entries` rows (by position)    |
| `recipe.data.main_ingredient_tags[]`  | `recipe_tags` (category = `ingredient`)     |
| `recipe.data.cuisine_tags[]`          | `recipe_tags` (category = `cuisine`)        |
| `recipe.data.type_tags[]`             | `recipe_tags` (category = `type`)           |
| `recipe.data.season_tags[]`           | `recipe_tags` (category = `season`)         |
| `recipe.data.related_recipes[]`       | `related_recipes` rows                      |
| `ingredient_tag.uid` / `.data.ingredient_tag` | `tags` (category = `ingredient`)    |
| `cuisine_tag.uid` / `.data.cuisine_tag`       | `tags` (category = `cuisine`)       |
| `type_tag.uid` / `.data.type_tag`             | `tags` (category = `type`)          |
| `season_tag.uid` / `.data.season_tag`         | `tags` (category = `season`)        |
| `cook_next_list.data.next_recipes[]`          | `cook_next_list` rows               |
| `favorites_list.data.favorite_recipes[]`      | `favorites_list` rows               |

¹ **Weekday field — legacy Select → boolean conversion**: The live Prismic database stores this as a Select field named `weekday_tag` with values `'Yes'` or `'No'` (a legacy type). The content-type JSON in this repo was updated to rename the field to `is_weekday_meal: Boolean`, but that change was never deployed to Prismic. The migration script must read `data.weekday_tag === 'Yes'` and write `weekday = true`; all other values (`'No'`, null, missing) map to `weekday = false`.

**Fields excluded from migration**:
- `recipe.data.is_sunday_meal` — not used in any page or query in the 2026 site; excluded from the Supabase schema.
- `recipe.data.meal_type_tags[]` / `meal_tag` content type — not used in any page or query in the 2026 site; excluded.
- `cook_next_list.data.list_name` / `favorites_list.data.list_name` — UI labels in Prismic only; not needed in the data model.

## Mapping: Data Model → TypeScript Types (2026 site)

| Data model                                          | TypeScript type field           |
|-----------------------------------------------------|---------------------------------|
| `recipes` row                                       | `Recipe`                        |
| `tags` row                                          | `Tag`                           |
| `ingredient_entries` rows ordered by `position`     | `Recipe.ingredients: IngredientSlice[]` |
| `instruction_entries` rows ordered by `position`    | `Recipe.instructions: InstructionSlice[]` |
| `recipe_tags` → `tags` (category = `cuisine`)       | `Recipe.cuisine_tags: Tag[]`    |
| `recipe_tags` → `tags` (category = `ingredient`)    | `Recipe.ingredient_tags: Tag[]` |
| `recipe_tags` → `tags` (category = `type`)          | `Recipe.type_tags: Tag[]`       |
| `recipe_tags` → `tags` (category = `season`)        | `Recipe.season_tags: Tag[]`     |
| `related_recipes` → `recipes` (ordered)             | `Recipe.related_recipes: RecipeSummary[]` |
| `cook_next_list` → `recipes` (ordered)              | `getCookNextRecipes(): Recipe[]` |
| `favorites_list` → `recipes` (ordered)              | `getFavoriteRecipes(): RecipeSummary[]` |
