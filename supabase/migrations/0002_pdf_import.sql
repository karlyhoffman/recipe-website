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
