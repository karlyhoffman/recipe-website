-- Fix import_recipe RPC: use correct recipe_id (uuid), capture it via RETURNING,
-- and supply the required position column for ingredient_entries and instruction_entries.
CREATE OR REPLACE FUNCTION import_recipe(
  p_uid text,
  p_title text,
  p_status text,
  p_import_source text,
  p_created_at timestamptz,
  p_ingredients jsonb,
  p_instructions jsonb
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_recipe_id uuid;
BEGIN
  INSERT INTO recipes (uid, title, status, import_source, created_at)
    VALUES (p_uid, p_title, p_status, p_import_source, p_created_at)
    RETURNING id INTO v_recipe_id;

  INSERT INTO ingredient_entries (recipe_id, position, type, name, amount, preparation)
    SELECT v_recipe_id,
           (ROW_NUMBER() OVER ())::integer,
           el->>'type', el->>'name', el->>'amount', el->>'preparation'
    FROM jsonb_array_elements(p_ingredients) AS el;

  INSERT INTO instruction_entries (recipe_id, position, type, text)
    SELECT v_recipe_id,
           (ROW_NUMBER() OVER ())::integer,
           el->>'type', el->>'text'
    FROM jsonb_array_elements(p_instructions) AS el;
END;
$$;
