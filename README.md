# Recipe Website

A collection of recipe website iterations built with Next.js over the years. Within each directory is a standalone project representing a different version of the site.

## Projects

| Directory | Next.js | Router Type | React | CMS |
|---|---|---|---|---|
| `prismic` | 13.x | Pages | 18 | Prismic (@prismicio/client) |
| `supabase` | 16.x | App | 19 | Supabase (@supabase/ssr) |

## Getting Started

Navigate into the project you want to run:

```bash
cd prismic
# or
cd supabase
```

Install dependencies:

```bash
npm install
# or
yarn
```

Start the dev server at [http://localhost:3000](http://localhost:3000):

```bash
npm run dev
# or
yarn dev
```

Build for production:

```bash
npm run build
```

## Environment Variables

Each project requires its own `.env` file with CMS credentials before running locally.

##### `prismic`

Create a `.env` file in the `prismic/` directory:

```env
NEXT_PUBLIC_PRISMIC_API_URL=https://your-repo-name.cdn.prismic.io/api/v2
NEXT_PUBLIC_PRISMIC_ACCESS_TOKEN=your-access-token
```

- **API URL** — Prismic Dashboard → your repository → Settings → API & Security → API Endpoint
- **Access Token** — same page → Generate an access token (only required for private repositories)

##### `supabase`

Create a `.env.local` file in the `supabase/` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=sk-ant-...
```

- Both values — Supabase Dashboard → Project Settings → API

If deploying with Vercel, both variables must also be added to **Vercel → Project Settings → Environment Variables** before deployment.

## Deploy

Deploy a preview via the [Vercel CLI](https://vercel.com/docs/cli):

```bash
vercel
```

Deploy to production:

```bash
vercel --prod
```

You can also automate deployments with GitHub pull requests.