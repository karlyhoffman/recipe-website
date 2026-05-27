# Research: Migrate Recipe Backend from Prismic to Supabase

**Feature**: `001-prismic-to-supabase` | **Date**: 2026-05-27

---

## Decision 1: Supabase Client Library & Instantiation

**Decision**: Use `@supabase/ssr` with `createServerClient()`, instantiated per request inside each server component or data-fetching function.

**Rationale**: The 2026 site uses Next.js App Router with React Server Components. `@supabase/ssr` is designed for this environment. Since the site has no user auth or sessions, cookie config can be minimal (`{ cookies: { getAll: () => [] } }`). A per-request instantiation is required (not a singleton) to avoid shared state across requests in the server environment.

**Environment variables needed**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The `NEXT_PUBLIC_` prefix makes them accessible in both server and client contexts if ever needed. The anon key (public, read-only RLS) is sufficient — no service role key needed.

**Caching note**: Supabase queries via `createServerClient()` are not automatically cached by Next.js (unlike `fetch()`). Pages using `generateStaticParams` will query at build time. For ISR, export `revalidate` from the page module.

**Alternatives considered**: `@supabase/supabase-js` directly (works fine for server-only use, but `@supabase/ssr` is the officially supported path for App Router and handles edge cases better).

---

## Decision 2: Prismic Content Export Approach

**Decision**: Use `client.getAllByType(type, { fetchLinks })` for each content type in a single-pass export script. Process tags first, then recipes.

**Rationale**: `getAllByType` handles pagination transparently (returns all pages, typically 100 docs/request). A `fetchLinks` array on the recipe fetch can inline related document data (tag names, related recipe titles) in one round-trip, avoiding N+1 queries.

**Export order**:
1. All tag types (`ingredient_tag`, `cuisine_tag`, `type_tag`, `season_tag`) — needed first to resolve foreign keys for recipe associations
2. `cook_next_list` singleton — fetch with `fetchLinks: ['recipe.title']`
3. `favorites_list` singleton — same
4. All `recipe` documents — with `fetchLinks` for all tag types and related recipe titles

**Prismic slice shape** (for ingredient/instruction entries):
```
{ slice_type: 'ingredient' | 'ingredient_heading' | 'recipe_instruction' | 'instruction_heading', primary: { ... } }
```
The migration script must map `slice_type` → `type` ('ingredient'/'heading') and extract fields from `primary`.

**Alternatives considered**: Paginated manual fetch with `getByType` — unnecessary given `getAllByType` handles this.

---

## Decision 3: Recipe Title Search Implementation

**Decision**: Use PostgreSQL `tsvector` with a GIN index and Supabase's `.textSearch()` method.

**Rationale**: A generated `tsvector` column on the `title` field with a GIN index is the recommended Supabase approach. It handles word boundaries, is fast at any scale, and uses `websearch_to_tsquery` which accepts natural-language user input without escaping concerns. Setup is a one-time migration step.

**Schema addition**:
```sql
alter table recipes
  add column title_fts tsvector
  generated always as to_tsvector('english', title) stored;

create index recipes_title_fts_idx on recipes using gin (title_fts);
```

**Query**:
```js
supabase.from('recipes').select('id, uid, title').textSearch('title_fts', term)
```

**Alternatives considered**:
- `ILIKE '%term%'` — simpler, no setup, but can't use an index efficiently and doesn't handle inflections. Acceptable fallback if tsvector adds unwanted complexity.
- Searching broader fields (notes, ingredients) — out of scope per FR-008; title search is sufficient.

---

## Decision 4: Schema Design Approach

**Decision**: Relational tables with a unified `tags` table (discriminated by `category` column) and separate ordered child tables for ingredient and instruction entries.

**Rationale**: The 2026 TypeScript data model groups all four tag categories the same way (`Tag[]`). A single `tags` table with a `category` discriminator ('ingredient' | 'cuisine' | 'type' | 'season') mirrors this exactly and simplifies queries. Ingredient and instruction entries need preserved order, so they use a `position` integer column rather than an array/JSON column — this keeps them queryable and correctable via the database admin tools.

**Alternatives considered**:
- JSONB arrays for ingredients/instructions — simpler schema, but harder to inspect or edit individual entries in the database admin UI. Rejected because the spec requires direct database management.
- Separate tables per tag category — more tables, no query benefit given the category discriminator covers it cleanly.
