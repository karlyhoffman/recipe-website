-- Fix 6 security advisor warnings introduced in specs/002-pdf-recipe-import.
--
-- 1. function_search_path_mutable: pin search_path on import_recipe
-- 2-4. rls_policy_always_true: replace WITH CHECK (true) on INSERT policies
-- 5-6. anon/authenticated_security_definer_function_executable:
--      switch import_recipe to SECURITY INVOKER so it runs as the caller
--      (anon callers will be blocked by RLS; no SECURITY DEFINER bypass needed)

-- ── import_recipe: SECURITY INVOKER + pinned search_path ────────────────────
CREATE OR REPLACE FUNCTION public.import_recipe(
  p_uid text,
  p_title text,
  p_status text,
  p_import_source text,
  p_created_at timestamptz,
  p_ingredients jsonb,
  p_instructions jsonb
) RETURNS void
  LANGUAGE plpgsql
  SECURITY INVOKER
  SET search_path = ''
AS $$
DECLARE
  v_recipe_id uuid;
BEGIN
  INSERT INTO public.recipes (uid, title, status, import_source, created_at)
    VALUES (p_uid, p_title, p_status, p_import_source, p_created_at)
    RETURNING id INTO v_recipe_id;

  INSERT INTO public.ingredient_entries (recipe_id, position, type, name, amount, preparation)
    SELECT v_recipe_id,
           (ROW_NUMBER() OVER ())::integer,
           el->>'type', el->>'name', el->>'amount', el->>'preparation'
    FROM jsonb_array_elements(p_ingredients) AS el;

  INSERT INTO public.instruction_entries (recipe_id, position, type, text)
    SELECT v_recipe_id,
           (ROW_NUMBER() OVER ())::integer,
           el->>'type', el->>'text'
    FROM jsonb_array_elements(p_instructions) AS el;
END;
$$;

-- Restrict execution to authenticated users only (removes the default PUBLIC grant)
REVOKE EXECUTE ON FUNCTION public.import_recipe(text, text, text, text, timestamptz, jsonb, jsonb) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.import_recipe(text, text, text, text, timestamptz, jsonb, jsonb) TO authenticated;

-- ── INSERT policies: replace WITH CHECK (true) ───────────────────────────────
DROP POLICY "authenticated insert" ON public.recipes;
DROP POLICY "authenticated insert" ON public.ingredient_entries;
DROP POLICY "authenticated insert" ON public.instruction_entries;

CREATE POLICY "authenticated insert" ON public.recipes
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "authenticated insert" ON public.ingredient_entries
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "authenticated insert" ON public.instruction_entries
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);
