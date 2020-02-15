import PrismicLib from 'prismic-javascript';
import { PRISMIC_API_URL, PRISMIC_ACCESS_TOKEN } from '../config.json';

let frontClient;

const filterForNull = suspectArray => {
  const filteredPageIDs = suspectArray.filter(el => el != null);
  return filteredPageIDs;
};

export const Client = (req = null) => {
  // prevent generate new instance for client side since we don't need the refreshed request object.
  if (!req && frontClient) return frontClient;

  const options = {
    ...(req ? { req } : {}),
    ...(PRISMIC_ACCESS_TOKEN ? { accessToken: PRISMIC_ACCESS_TOKEN } : {})
  };
  return PrismicLib.client(PRISMIC_API_URL, options);
};

export const Prismic = PrismicLib;

export const fetchDocumentsByType = async ({ type, req, options }) =>
  Client(req).query(Prismic.Predicates.at('document.type', type), options);

export const fetchDocumentsByIDs = async ({ ids, req, options }) =>
  Client(req).query(
    Prismic.Predicates.in('document.id', filterForNull(ids)),
    options
  );

export const fetchDocumentByUID = async ({ type, id, req, options }) =>
  Client(req).query(Prismic.Predicates.at(`my.${type}.uid`, id), options);

export const linkResolver = doc => {
  if (doc && doc.type) {
    if (doc.type === 'recipe')
      return { href: '/recipes/[recipe]', as: `/recipes/${doc.uid}` };

    if (doc.type === 'ingredient_tag')
      return {
        href: '/recipes/ingredients/[ingredient-tag]',
        as: `/recipes/ingredients/${doc.uid}`
      };

    if (doc.type === 'cuisine_tag')
      return {
        href: '/recipes/cuisines/[cuisine-tag]',
        as: `/recipes/cuisines/${doc.uid}`
      };

    if (doc.type === 'type_tag')
      return {
        href: '/recipes/dish-types/[dish-type]',
        as: `/recipes/dish-types/${doc.uid}`
      };

    if (doc.type === 'season_tag')
      return {
        href: '/recipes/seasons/[season]',
        as: `/recipes/seasons/${doc.uid}`
      };
  }

  return {
    href: '/index',
    as: `/`
  };
};
