import { createClient } from 'prismicio';
import * as prismic from '@prismicio/client';
import { PrismicText, PrismicLink } from '@prismicio/react';
import { Row, Column, PaginationMenu } from 'components';
import styles from 'styles/pages/search.module.scss';

const QUERY_SIZE = 100;

function Search({ term = '', recipes = [], totalCount, pageSize, page, test }) {
  const hasResults = term && !!recipes.length;
  const noResults = term && !!!recipes.length;

  return (
    <Row id={styles.search}>
      <Column>
        <h1 className="h4 outline">Search {term && `results for "${term}"`}</h1>

        {hasResults && (
          <>
            <ul className="recipe-list">
              {recipes.map((recipe, index) => (
                <li key={recipe?.id || index}>
                  <PrismicLink document={recipe} className="h5 highlight">
                    <PrismicText field={recipe?.data?.title} />
                  </PrismicLink>
                </li>
              ))}
            </ul>
            <PaginationMenu {...{ totalCount, pageSize, page }} />
          </>
        )}

        {noResults && <p>No recipes found.</p>}

        {!term && <p>Use the search bar to find recipes.</p>}
      </Column>
    </Row>
  );
}

export default Search;

Search.getInitialProps = async (context) => {
  const { res, query } = context;
  const page = query?.page || 1;

  if (res) res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

  if (!!query?.search?.length) {
    const term = query.search.replace(/"/g, '');
    const { results, total_results_size } = await createClient().get({
      predicates: [prismic.predicate.at('document.type', 'recipe'), prismic.predicate.fulltext('document', term)],
    });

    return {
      term: query.search,
      recipes: results || [],
      totalCount: total_results_size || 0,
      pageSize: QUERY_SIZE,
      page,
    };
  }

  return {
    recipes: 0,
    totalCount: 0,
    pageSize: QUERY_SIZE,
    page,
  };
};
