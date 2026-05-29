# Recipe Website

A collection of recipe website iterations built with Next.js over the years. Within each directory is a standalone project representing a different version of the site.

## Projects

| Directory | Next.js | Router Type | React | CMS |
|---|---|---|---|
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

## [TODO: Prismic and Supabase-specific instructions, i.e, API Keys
## [TODO: Create a wiki for each^^ and add other documentation]

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