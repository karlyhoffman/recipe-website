import Link from 'next/link';
// import { RichText } from 'prismic-reactjs';
// import { linkResolver } from 'api/prismic-configuration';
// import { fetchRecipesBySearchTerm } from 'api/prismic-queries';
import { Row, Column, PaginationMenu } from 'components';
import styles from 'styles/pages/search.module.scss';

const QUERY_SIZE = 100;

function Search({ term = '', recipes = [], totalCount, pageSize, page }) {
  const hasResults = term && !!recipes.length;
  const noResults = term && !!!recipes.length;

  return (
    <Row id={styles.search}>
      <Column>
        <h1 className="h4 outline">Search {term && `results for "${term}"`}</h1>

        {hasResults && (
          <>
            <ul className={styles.results}>
              {recipes.map((recipe) => (
                <li key={recipe.id}>
                  <Link href={linkResolver(recipe)} className="h5 highlight">
                    {RichText.asText(recipe.data.title)}
                  </Link>
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
  const { req, res, query } = context;
  const page = query?.page || 1;

  if (res) res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

  // if (!!query?.search?.length) {
  //   const term = query.search.replace(/"/g, '');
  //   const { results, total_results_size } = await fetchRecipesBySearchTerm({
  //     term,
  //     req,
  //     options: { orderings: '[my.recipe.title]', pageSize: QUERY_SIZE, page },
  //   });

  //   return {
  //     term: query.search,
  //     recipes: results || [],
  //     totalCount: total_results_size || 0,
  //     pageSize: QUERY_SIZE,
  //     page,
  //   };
  // }

  return {
    recipes: 0,
    totalCount: 0,
    pageSize: QUERY_SIZE,
    page,
  };
};
