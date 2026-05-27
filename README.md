# Recipe Website

A collection of recipe website iterations built with Next.js over the years. Within each directory is a standalone project representing a different version of the site.

## Projects

| Directory | Next.js (router type) | React | CMS |
|---|---|---|---|
| `2020-recipe-website` | 9.x (Pages) | 16 | Prismic (prismic-javascript) |
| `2021-recipe-website` | 10.x (Pages) | 17 | Prismic (prismic-javascript) |
| `2023-recipe-website` | 13.x (Pages) | 18 | Prismic (@prismicio/client) |
| `2026-recipe-website` | 16.x (App) | 19 | Supabase |

## Getting Started

Navigate into the project you want to run:

```bash
cd 2026-recipe-website
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

## Deploy

Deploy a preview via the [Vercel CLI](https://vercel.com/docs/cli):

```bash
vercel
```

Deploy to production:

```bash
vercel --prod
```
