import * as prismic from '@prismicio/client';
import * as prismicNext from '@prismicio/next';

const apiEndpoint = process.env.NEXT_PUBLIC_PRISMIC_API_URL;
const accessToken = process.env.NEXT_PUBLIC_PRISMIC_ACCESS_TOKEN;

export const repositoryName = prismic.getRepositoryName(apiEndpoint);

const routes = [
  {
    type: 'recipe',
    path: '/recipes/:uid',
  },
  {
    type: 'ingredient_tag',
    path: '/recipes/ingredients/:uid',
  },
  { type: 'cuisine_tag', path: '/recipes/cuisines/:uid' },
  { type: 'type_tag', path: '/recipes/dish-types/:uid' },
  { type: 'season_tag', path: '/recipes/seasons/:uid' },
];

export const createClient = (config = {}) => {
  const client = prismic.createClient(apiEndpoint, {
    accessToken,
    routes,
    ...config,
  });

  prismicNext.enableAutoPreviews({
    client,
    previewData: config.previewData,
    req: config.req,
  });

  return client;
};
