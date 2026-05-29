# Data Model: PDF Recipe Import

## Schema Changes

### Migration: `supabase/migrations/0002_pdf_import.sql`

Adds `status` and `import_source` to the existing `recipes` table; adds INSERT and UPDATE RLS policies for authenticated users.

```sql
-- status: existing recipes default to 'published'; PDF imports default to 'draft'
ALTER TABLE recipes
  ADD COLUMN status text NOT NULL DEFAULT 'published',
  ADD CONSTRAINT recipes_status_check CHECK (status IN ('draft', 'published'));

-- import_source: null for manually created recipes; PDF filename for imported recipes
ALTER TABLE recipes
  ADD COLUMN import_source text;

-- Allow authenticated users to insert new recipes
CREATE POLICY "authenticated insert" ON recipes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated insert" ON ingredient_entries
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated insert" ON instruction_entries
  FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update draft recipes
CREATE POLICY "authenticated update draft" ON recipes
  FOR UPDATE TO authenticated USING (status = 'draft');
```

-- Atomic recipe import: all three INSERTs run in a single transaction.
-- If any INSERT fails, the entire operation is rolled back (FR-015).
CREATE OR REPLACE FUNCTION import_recipe(
  p_uid text,
  p_title text,
  p_status text,
  p_import_source text,
  p_created_at timestamptz,
  p_ingredients jsonb,
  p_instructions jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO recipes (uid, title, status, import_source, created_at)
    VALUES (p_uid, p_title, p_status, p_import_source, p_created_at);

  INSERT INTO ingredient_entries (recipe_uid, name, amount, preparation, type)
    SELECT p_uid,
           el->>'name', el->>'amount', el->>'preparation', el->>'type'
    FROM jsonb_array_elements(p_ingredients) AS el;

  INSERT INTO instruction_entries (recipe_uid, text, type)
    SELECT p_uid, el->>'text', el->>'type'
    FROM jsonb_array_elements(p_instructions) AS el;
END;
$$;

> Note: `created_at` has no default in the current schema (`NOT NULL` with no default). The INSERT must supply it explicitly (`new Date().toISOString()`). The save route calls `supabase.rpc('import_recipe', { ... })` instead of three separate INSERTs.

---

## TypeScript Type Changes

### Additions to `types/index.ts`

```typescript
// ImportDraft — transient type for the extraction result (never persisted directly)
export interface ImportDraft {
  title: string | null;
  ingredients: IngredientSlice[];
  instructions: InstructionSlice[];
  uncategorized: string[];      // text blocks the AI could not classify
  filename: string;
}
```

### Modifications to `types/index.ts`

```typescript
// Recipe — add two new optional fields
export interface Recipe extends RecipeSummary {
  // ... existing fields ...
  status: 'draft' | 'published';
  import_source?: string;
}
```

> `RecipeSummary` does not need `status` — recipe listings query all records regardless of status (the app is single-user). The draft/published distinction is only relevant on the detail view and within the import flow.

---

## Entity States

```
PDF file (uploaded, in-memory only)
        ↓  pdf-parse extracts raw text
        ↓  Claude API identifies title / ingredients / instructions
ImportDraft (in-memory, returned to client as JSON)
        ↓  user reviews and edits in browser
        ↓  user clicks "Save Recipe"
recipes row  (status: 'draft', import_source: filename)
  + ingredient_entries rows
  + instruction_entries rows
        ↓  future: user publishes
recipes row  (status: 'published')
```

The uploaded PDF file is discarded immediately after `pdf-parse` extracts text. It is never written to disk or to any storage bucket.

---

## UID Generation Rules

1. Slugify the recipe title: lowercase, replace spaces and special characters with hyphens, strip consecutive hyphens.
2. If the result is empty or contains only hyphens, substitute `"recipe"` as the base slug.
3. Query `recipes` for existing `uid` values matching `<slug>` or `<slug>-N`.
4. If no conflict: use `<slug>`.
5. On conflict: append `-2`, then `-3`, etc., until a free value is found.
