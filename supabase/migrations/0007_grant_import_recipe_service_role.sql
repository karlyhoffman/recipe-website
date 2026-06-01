-- save/route.ts now calls import_recipe via createServiceRoleClient() after the
-- custom JWT auth migration removed Supabase session auth from that handler.
-- Migration 0004 granted EXECUTE only to the authenticated role (7-param
-- signature). The 12-param overload added in 0006 inherited no explicit grant;
-- service_role was never covered. This closes that gap.
GRANT EXECUTE ON FUNCTION public.import_recipe(
  text, text, text, text, timestamptz, jsonb, jsonb,
  integer, integer, integer, text, uuid[]
) TO service_role;
