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
| `title_fts`    | tsvector  | yes      | Generated from `title`, for search |
| `created_at`   | timestamptz | no     | Default now()                |

**Constraints**: `uid` is unique.
**Index**: GIN index on `title_fts` for full-text search.

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

---

### `recipe_tags`

Junction table linking recipes to tags (many-to-many).

| Column      | Type | Nullable | Notes                    |
|-------------|------|----------|--------------------------|
| `recipe_id` | uuid | no       | FK → recipes.id          |
| `tag_id`    | uuid | no       | FK → tags.id             |

**Constraints**: Primary key is `(recipe_id, tag_id)`.

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
| `aisle`       | text    | yes      | Grocery aisle grouping            |

**Constraints**: `type` constrained to `heading` or `ingredient`.

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

**Constraints**: `type` constrained to `heading` or `instruction`.

---

### `related_recipes`

Ordered list of related recipes for a given recipe (self-referencing).

| Column              | Type    | Nullable | Notes                          |
|---------------------|---------|----------|--------------------------------|
| `recipe_id`         | uuid    | no       | FK → recipes.id (source)       |
| `related_recipe_id` | uuid    | no       | FK → recipes.id (target)       |
| `position`          | integer | no       | 0-based, defines display order |

**Constraints**: Primary key is `(recipe_id, related_recipe_id)`.

---

### `cook_next_list`

Ordered editorial curation of recipes to cook next. Drives both the homepage "Cook Next" section and the Groceries ingredient list.

| Column      | Type    | Nullable | Notes                          |
|-------------|---------|----------|--------------------------------|
| `id`        | uuid    | no       | Primary key, generated         |
| `recipe_id` | uuid    | no       | FK → recipes.id                |
| `position`  | integer | no       | 0-based, defines display order |

---

### `favorites_list`

Ordered editorial curation of current favorite recipes. Drives the homepage "Current Favorites" section.

| Column      | Type    | Nullable | Notes                          |
|-------------|---------|----------|--------------------------------|
| `id`        | uuid    | no       | Primary key, generated         |
| `recipe_id` | uuid    | no       | FK → recipes.id                |
| `position`  | integer | no       | 0-based, defines display order |

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
| `recipe.data.weekday_tag` (`'Yes'`)   | `recipes.weekday = true`                    |
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
