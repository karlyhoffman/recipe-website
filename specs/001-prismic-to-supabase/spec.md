# Feature Specification: Migrate Recipe Backend from Prismic to Supabase

**Feature Branch**: `001-prismic-to-supabase`

**Created**: 2026-05-27

**Status**: Draft

**Input**: User description: "Migrate the Prismic backend of 2023-recipe-website to Supabase in 2026-recipe-website"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Recipe Detail Pages (Priority: P1)

A visitor navigates directly to a recipe URL (e.g., `/recipes/pasta-carbonara`) and sees the full recipe: title, prep and total time, servings, notes, source, ingredient list (with optional section headings), step-by-step instructions (with optional section headings), related recipes, and category tags (ingredient, cuisine, dish type, season, weekday).

**Why this priority**: This is the core content unit. All other features depend on recipes being stored and retrievable. Without this, nothing else works.

**Independent Test**: Deploy the site with Supabase as the data source, visit any recipe URL that existed in Prismic, and confirm the full recipe renders correctly with all fields populated.

**Acceptance Scenarios**:

1. **Given** a recipe exists in Supabase with all fields populated, **When** a visitor navigates to `/recipes/{slug}`, **Then** the page displays the title, timing, servings, notes, source, ingredients, instructions, tags, and related recipes — matching what was previously shown from Prismic.
2. **Given** a recipe with optional fields omitted (e.g., no notes, no source), **When** a visitor views that recipe, **Then** those optional sections are hidden gracefully with no broken layout.
3. **Given** a slug that does not exist, **When** a visitor navigates to that URL, **Then** a 404 page is shown.

---

### User Story 2 - Browse Recipes by Category Tag (Priority: P2)

A visitor browses recipes filtered by a specific tag — ingredient (e.g., "chicken"), cuisine (e.g., "italian"), dish type (e.g., "main-course"), or season (e.g., "fall") — by navigating to the tag overview or a specific tag detail page.

**Why this priority**: Tag browsing is the primary discovery mechanism for the site. After recipe detail, this is the most-used feature.

**Independent Test**: Navigate to `/recipes/ingredients`, click a tag, and confirm the resulting recipe list matches what was shown in the original site.

**Acceptance Scenarios**:

1. **Given** tags exist in Supabase, **When** a visitor navigates to a tag category overview (e.g., `/recipes/ingredients`), **Then** all tags for that category are listed alphabetically.
2. **Given** recipes are tagged in Supabase, **When** a visitor selects a tag (e.g., `/recipes/cuisines/italian`), **Then** all recipes with that tag are listed.
3. **Given** a tag with no associated recipes, **When** a visitor views that tag's page, **Then** an empty state is shown with a clear message.
4. **Given** a tag slug that does not exist, **When** a visitor navigates to that URL, **Then** a 404 page is shown.

---

### User Story 3 - Search Recipes (Priority: P3)

A visitor enters a search term in the search bar and sees a list of matching recipes returned in real time or on submit.

**Why this priority**: Search provides a fast path to specific recipes. It depends on recipe data being in Supabase, making it P3 after the core browsing features.

**Independent Test**: Enter a recipe title or keyword into the search field and confirm results appear from the Supabase data source.

**Acceptance Scenarios**:

1. **Given** recipes in Supabase, **When** a visitor searches for a term that appears in a recipe title, **Then** matching recipes are listed.
2. **Given** a search term with no matches, **When** a visitor submits it, **Then** an empty state is shown with a clear message.
3. **Given** an empty search term, **When** a visitor submits, **Then** no results are shown and the visitor is prompted to enter a search term.

---

### User Story 4 - Homepage Curations (Priority: P4)

A visitor lands on the homepage and sees four curated recipe lists: "Recipes to Cook Next," "Current Favorites," "Recently Added," and "Ideas for Next Week." Each list links to the corresponding recipe detail page.

**Why this priority**: The homepage is the entry point, but its curated lists depend on recipes being in Supabase and on editorial curation data (cook-next and favorites lists) being migrated too.

**Independent Test**: Visit the homepage and confirm all four sections show recipes pulling from Supabase, including the manually curated cook-next and favorites lists.

**Acceptance Scenarios**:

1. **Given** recipes in Supabase and curated lists configured, **When** a visitor loads the homepage, **Then** all four sections appear with the correct recipe titles and links.
2. **Given** a curated list is empty, **When** the homepage loads, **Then** that section is hidden or shows an appropriate empty state.

---

### User Story 5 - Grocery List from Cook-Next Recipes (Priority: P5)

A visitor navigates to the Groceries page and sees a consolidated shopping list built from the recipes currently on the "Cook Next" list, with ingredients grouped by aisle and duplicates flagged.

**Why this priority**: This feature depends on the cook-next list and the full ingredient data (including aisle field) being in Supabase. It is the most data-intensive feature and can be delivered after the core recipe browsing works.

**Independent Test**: Add recipes to the cook-next list in Supabase, visit `/groceries`, and confirm ingredients are grouped by aisle.

**Acceptance Scenarios**:

1. **Given** recipes on the cook-next list with ingredient aisle data, **When** a visitor views the Groceries page, **Then** all ingredients are listed grouped by aisle.
2. **Given** the same ingredient appears in multiple cook-next recipes, **When** the grocery list renders, **Then** the duplicate is flagged visually.
3. **Given** no recipes on the cook-next list, **When** a visitor views Groceries, **Then** an empty state is shown with a clear message.

---

### User Story 6 - Data Migration: All Existing Content Preserved (Priority: P1, Prerequisite)

All recipes, tags, curated lists, and related content that exist in Prismic are migrated to Supabase with full fidelity — no records lost, no fields corrupted, and all URL slugs preserved so that existing links continue to work.

**Why this priority**: Without a complete migration, stories 1–5 cannot be satisfied. This is a prerequisite, not a user-facing story, but it is the highest-risk step.

**Independent Test**: After migration, compare the total count of recipes and each tag type in Supabase against the count in Prismic. Spot-check 5+ recipes across different types for field accuracy and confirm existing URLs still resolve.

**Acceptance Scenarios**:

1. **Given** all Prismic content exported, **When** imported to Supabase, **Then** the count of recipes and each tag category matches the Prismic source exactly.
2. **Given** a recipe URL that existed in the original site, **When** visited in the new site, **Then** it resolves correctly (no 404s for previously valid URLs).
3. **Given** a recipe with rich-text notes or source in Prismic, **When** migrated, **Then** the content is preserved as plain text (or markdown) without data loss.

---

### Edge Cases

- A recipe has no tags at all — tag sections on the detail page are hidden, not broken.
- The cook-next or favorites list is empty — the homepage handles this without layout breakage.
- A tag exists but no recipes are associated with it — the tag detail page shows an empty state.
- Recipe slugs containing special characters — slugs are preserved exactly as they were in Prismic to avoid broken links.
- The `weekday_tag` field in the live Prismic database is a legacy Select field with values `'Yes'`/`'No'`; the migration converts `'Yes'` → `weekday = true` and all other values → `weekday = false`. Weekday-tagged recipes appear correctly under `/recipes/weekday`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The 2026 site MUST retrieve all recipe data (title, slug, timing, servings, notes, source, weekday flag, ingredients, instructions, tags, related recipes) from Supabase, not from placeholder data or Prismic.
- **FR-002**: The 2026 site MUST retrieve all tag data (ingredient tags, cuisine tags, dish-type tags, season tags) from Supabase.
- **FR-003**: The 2026 site MUST retrieve the cook-next list and favorites list from Supabase.
- **FR-004**: All existing recipe slugs from the Prismic-powered 2023 site MUST be preserved in Supabase so that no URLs break after migration.
- **FR-005**: Recipe ingredient entries MUST preserve the type (plain ingredient vs. section heading), quantity/amount, name, optional preparation note, and aisle grouping.
- **FR-006**: Recipe instruction entries MUST preserve the type (plain instruction vs. section heading) and text content, including inline bold formatting.
- **FR-007**: The site MUST display a 404 for any recipe or tag slug that does not exist in Supabase.
- **FR-008**: Search MUST query Supabase and return recipes matching the visitor's search term against recipe titles (at minimum).
- **FR-009**: The Groceries page MUST derive its ingredient list from cook-next recipes stored in Supabase, including per-ingredient aisle data.
- **FR-010**: Recipe hero images are intentionally excluded from the 2026 application to avoid storage costs. The `hero_image_url` field has been removed from the `Recipe` type and the recipe detail template. This is a deliberate product decision, not a deferral — if images are added in a future phase it will require a new feature spec.
- **FR-011**: A content management UI is OUT OF SCOPE for this migration phase. Recipes and tags will be managed directly via the Supabase table editor in the interim. A dedicated admin UI is deferred to a future feature.

### Key Entities

- **Recipe**: The primary content unit. Has a unique slug, a title, timing data (prep and total minutes), servings count, optional notes, optional source, a yes/no weekday flag, an ordered list of ingredient entries, an ordered list of instruction entries, zero or more tag associations per category, and zero or more related recipe links.
- **Ingredient Entry**: An ordered item within a recipe's ingredient list. Either a section heading (name only) or an ingredient row (amount, name, optional preparation, aisle).
- **Instruction Entry**: An ordered item within a recipe's instruction list. Either a section heading (text) or an instruction step (text, may contain inline bold formatting).
- **Tag**: A categorization label with a unique slug and display name. Tags belong to one of four categories: ingredient, cuisine, dish type, or season.
- **Cook-Next List**: An editorially curated, ordered list of recipes marked to cook in the near future. Drives both the homepage "Cook Next" section and the Groceries ingredient list.
- **Favorites List**: An editorially curated, ordered list of recipes shown in the homepage "Current Favorites" section.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of recipes and tags that existed in Prismic are present and correctly populated in Supabase after migration — zero data loss.
- **SC-002**: 100% of previously valid recipe and tag URLs resolve correctly in the migrated site — zero broken links from the original site.
- **SC-003**: Every page that previously loaded from Prismic data loads from Supabase data with equivalent content visible to a site visitor.
- **SC-004**: The time to first meaningful content on recipe detail pages is equivalent to or better than the Prismic-powered version.
- **SC-005**: All placeholder data and Prismic dependencies are fully removed from the 2026 site after migration.

## Assumptions

- The 2026 site's existing data abstraction layer (`lib/data.ts`) provides the correct function signatures; only the implementations need to be replaced with Supabase queries — no UI changes are required.
- The TypeScript types defined in the 2026 site (`Recipe`, `Tag`, `RecipeSummary`, `IngredientSlice`, `InstructionSlice`) accurately reflect the target data shape; the Supabase schema will be designed to match these types. Note: `hero_image_url` has been intentionally removed from the `Recipe` type (see FR-010) and is not part of the schema.
- Recipe content will be exported from Prismic via its API (not manually re-entered); a one-time migration script will handle the transformation and import into Supabase.
- Rich-text fields in Prismic (notes, source) contain simple formatting (paragraphs, links, bold/italic); the migrated values will be stored as plain text or minimal markdown, which is sufficient given how the 2026 site renders them.
- The site is a personal/private recipe collection, so no row-level security or public write access is needed — read-only public access is sufficient for the site, with admin access for content management.
- The "weekday" field is stored as a legacy Select (`weekday_tag: 'Yes'/'No'`) in the live Prismic database; the migration converts this to a boolean in Supabase. The content-type JSON in this repo reflects a planned rename to `is_weekday_meal: Boolean` that was never deployed to Prismic.
- The "meal_tag" Prismic content type exists in the 2023 schema files but is not used in any page or query; it is out of scope for migration.
- The "is_sunday_meal" boolean field exists on the Prismic recipe content type but is not used in any page or query in the 2026 site; it is out of scope for this migration and will not be included in the Supabase schema.
- Pagination (present in the 2023 recipes overview) is not implemented in the 2026 site's current page structure and is out of scope unless explicitly added.
