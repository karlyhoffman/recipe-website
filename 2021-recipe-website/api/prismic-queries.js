import PrismicLib from 'prismic-javascript';
import { Client } from 'api/prismic-configuration';

export const Prismic = PrismicLib;

export const fetchSingleDocumentByType = async ({ type, req, options }) =>
  Client(req).getSingle(type, options);

export const fetchSingleDocumentByTypeAndUID = async ({ type, uid, req, options }) =>
  Client(req).getByUID(type, uid, options);

export const fetchMultipleDocumentsByType = async ({ type, req, options, predicates = [] }) =>
  Client(req).query(
    [Prismic.Predicates.at('document.type', type), ...predicates],
    options
  );

export const fetchMultipleDocumentsByID = async ({ ids, req, options }) =>
  Client(req).getByIDs(ids, options);

export const fetchUIDsForType = async ({ type, page = 1, results = [] }) => {
  let allPages = [...results];

  const pages = await Client().query(Prismic.Predicates.at('document.type', type), {
    page,
    pageSize: 100,
    fetch: `${type}.no_data_necessary`,
  });

  allPages = allPages.concat(pages.results);

  if (pages?.page === pages?.total_pages) return allPages.map((p) => p.uid);

  return fetchUIDsForType({ type, page: page + 1, results: allPages });
};

export const fetchRecipesByTag = async ({ tagID, type, tagTypeName, req }) =>
  Client(req).query(
    [
      Prismic.Predicates.at('document.type', 'recipe'),
      Prismic.Predicates.at(`my.recipe.${tagTypeName || type}s.${type}`, tagID),
    ],
    { orderings: '[my.recipe.title]', pageSize: 100 }
  );

export const fetchRecipesByWeekendTag = async ({ req }) =>
  Client(req).query(Prismic.Predicates.at('my.recipe.weekday_tag', 'Yes'), {
    orderings: '[my.recipe.title]',
    pageSize: 100,
  });

export const fetchRecipesBySearchTerm = async ({ term, req = null, options }) =>
  Client(req).query(
    [
      Prismic.Predicates.at('document.type', 'recipe'),
      Prismic.Predicates.fulltext('document', term),
    ],
    options
  );
