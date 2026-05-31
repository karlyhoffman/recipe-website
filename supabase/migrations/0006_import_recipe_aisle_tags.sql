-- Extend import_recipe to insert ingredient aisle and link recipe tags.
CREATE OR REPLACE FUNCTION public.import_recipe(
  p_uid text,
  p_title text,
  p_status text,
  p_import_source text,
  p_created_at timestamptz,
  p_ingredients jsonb,
  p_instructions jsonb,
  p_prep_minutes integer DEFAULT NULL,
  p_total_minutes integer DEFAULT NULL,
  p_servings integer DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_tag_ids uuid[] DEFAULT NULL
) RETURNS void
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = ''
AS $$
DECLARE
  v_recipe_id uuid;
BEGIN
  INSERT INTO public.recipes (uid, title, status, import_source, created_at, prep_minutes, total_minutes, servings, notes)
    VALUES (p_uid, p_title, p_status, p_import_source, p_created_at, p_prep_minutes, p_total_minutes, p_servings, p_notes)
    RETURNING id INTO v_recipe_id;

  INSERT INTO public.ingredient_entries (recipe_id, position, type, name, amount, preparation, aisle)
    SELECT v_recipe_id,
           (ROW_NUMBER() OVER ())::integer,
           el->>'type', el->>'name', el->>'amount', el->>'preparation', el->>'aisle'
    FROM jsonb_array_elements(p_ingredients) AS el;

  INSERT INTO public.instruction_entries (recipe_id, position, type, text)
    SELECT v_recipe_id,
           (ROW_NUMBER() OVER ())::integer,
           el->>'type', el->>'text'
    FROM jsonb_array_elements(p_instructions) AS el;

  IF p_tag_ids IS NOT NULL AND array_length(p_tag_ids, 1) > 0 THEN
    INSERT INTO public.recipe_tags (recipe_id, tag_id)
    SELECT v_recipe_id, unnest(p_tag_ids);
  END IF;
END;
$$;
