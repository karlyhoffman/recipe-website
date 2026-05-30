This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Variables

Create a `.env.local` file in this directory with the following variables:

```env
# Supabase — get both from Supabase Dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# PDF import: Anthropic API key for recipe extraction via Claude
ANTHROPIC_API_KEY=sk-ant-...

# PDF import: Supabase service role key for dev-mode unauthenticated writes
# Found in Supabase Dashboard → Project Settings → API → service_role key
# NEVER expose this in client code or production paths
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_ANON_KEY` must also be added to
**Vercel → Project Settings → Environment Variables** (Production, Preview, and
Development) before deploying; a build without them will fail at Supabase client
instantiation.

`ANTHROPIC_API_KEY` must be set in Vercel environment variables for the PDF import
feature to work in production. `SUPABASE_SERVICE_ROLE_KEY` is only used in local
development (`NODE_ENV=development`) and does not need to be set on Vercel.

## PDF Import Setup

The PDF import feature (`/import`) allows you to upload a recipe PDF, extract the
title, ingredients, and instructions via Claude, review and edit the result, and
save it as a draft recipe.

### New Dependencies

```bash
npm install pdf-parse @anthropic-ai/sdk
npm install --save-dev @types/pdf-parse
```

### Database Migration

Apply the migration before using the PDF import feature:

```bash
# With Supabase CLI
supabase db push

# Or paste supabase/migrations/0002_pdf_import.sql into the Supabase SQL Editor
```

This adds `status` and `import_source` columns to the `recipes` table and the
`import_recipe` RPC function. Existing recipes are unaffected (they default to
`status = 'published'`).

### Local Testing

1. Add `ANTHROPIC_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
2. Run `npm run dev`
3. Navigate to `http://localhost:3000/import`
4. Upload a text-based recipe PDF (not scanned/image-only)
5. Review the extracted content, edit as needed, and click **Save Recipe**
6. You are redirected to `/recipes/{uid}` where the draft recipe is visible

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
