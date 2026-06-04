-- Remove dead write policies from 0002/0004.
-- The app migrated to custom proxy auth in 0007 (service_role for writes).
-- Supabase Auth sign-up is disabled, so the authenticated role is permanently
-- unreachable from outside. These policies can never fire.
DROP POLICY "authenticated insert"      ON public.recipes;
DROP POLICY "authenticated insert"      ON public.ingredient_entries;
DROP POLICY "authenticated insert"      ON public.instruction_entries;
DROP POLICY "authenticated update draft" ON public.recipes;
