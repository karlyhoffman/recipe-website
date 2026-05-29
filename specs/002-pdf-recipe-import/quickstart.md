# Quickstart: PDF Recipe Import

## New Environment Variables

Add to `supabase/.env.local` (alongside existing `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_ANON_KEY`):

```bash
# Required for Claude API recipe extraction
ANTHROPIC_API_KEY=sk-ant-...

# Required for dev-mode unauthenticated writes (bypasses RLS)
# Found in Supabase dashboard → Project Settings → API → service_role key
SUPABASE_SERVICE_ROLE_KEY=...
```

## New Dependencies

From the `supabase/` directory:

```bash
npm install pdf-parse @anthropic-ai/sdk
npm install --save-dev @types/pdf-parse
```

## Database Migration

Apply `supabase/migrations/0002_pdf_import.sql`:

```bash
# With Supabase CLI (local dev stack)
supabase db push

# Or paste the migration SQL directly in Supabase dashboard → SQL Editor
```

This migration adds `status` and `import_source` columns to the `recipes` table, and adds INSERT/UPDATE RLS policies for authenticated users. Existing recipe rows are unaffected (they default to `status = 'published'`).

## Supabase Auth Setup

The import route requires Supabase Auth for production use:

1. In your Supabase project dashboard, go to **Authentication → Providers**
2. Enable **Email** provider (magic link or email + password — either works)
3. No additional configuration is required for the app; the session is managed via `@supabase/ssr` cookies

> In `NODE_ENV=development`, authentication is not required. The service role key is used for all writes when running `npm run dev`.

## Running the Feature Locally

```bash
cd supabase
npm run dev
```

Navigate to `http://localhost:3000/import`. In development mode, you can upload a PDF without signing in.

## Testing the Import Flow

1. Find or create a text-based recipe PDF (not a scanned/image-only document)
2. Upload at `/import`
3. Wait for extraction — a loading indicator shows while the PDF is processed
4. Review the extracted title, ingredients, and instructions on the review screen
5. Edit any incorrectly parsed content
6. Click **Save Recipe**
7. You are redirected to `/recipes/{uid}` where the draft recipe is visible
8. The draft does not appear in recipe listings until published (future feature)

## Verifying the Schema Migration

```sql
-- Confirm new columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'recipes'
  AND column_name IN ('status', 'import_source');

-- Confirm existing recipes are still published
SELECT COUNT(*) FROM recipes WHERE status = 'published';
```
