import Prismic from 'prismic-javascript';

const apiEndpoint = process.env.NEXT_PUBLIC_PRISMIC_API_URL;
const accessToken = process.env.NEXT_PUBLIC_PRISMIC_ACCESS_TOKEN;

const createClientOptions = (req = null, prismicAccessToken = null) => {
  const reqOption = req ? { req } : {};
  const accessTokenOption = prismicAccessToken ? { accessToken: prismicAccessToken } : {};
  return {
    ...reqOption,
    ...accessTokenOption,
  };
};

export const Client = (req = null) =>
  Prismic.client(apiEndpoint, createClientOptions(req, accessToken));

export const linkResolver = (doc) => {
  if (doc?.type && doc?.uid) {
    const { type, uid } = doc;

    if (type === 'recipe') {
      return `/recipes/${uid}`;
    }

    if (type === 'ingredient_tag') {
      return `/recipes/ingredients/${uid}`;
    }

    if (type === 'cuisine_tag') {
      return `/recipes/cuisines/${uid}`;
    }

    if (type === 'type_tag') {
      return `/recipes/dish-types/${uid}`;
    }

    if (type === 'season_tag'){
      return `/recipes/seasons/${uid}`;
    }
  }

  return '/';
};
