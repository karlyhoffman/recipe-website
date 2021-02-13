import Link from 'next/link';
import { RichText } from 'prismic-reactjs';
import { linkResolver } from 'api/prismic-configuration';
import { fetchRecipesBySearchTerm } from 'api/prismic-queries';
import { PaginationMenu } from 'components';

const QUERY_SIZE = 100;

function Search({ term, recipes, totalCount, pageSize, page }) {
  return (
    <div id="search_page" className="container">
      <div className="row">
        {term ? (
          <div className="col-12">
            {!!recipes.length ? (
              <>
                <h1>Search Results for &quot;{term}&quot;</h1>
                <ul className="recipe-list">
                  {recipes.map((recipe) => (
                    <li key={recipe.id}>
                      <Link href={linkResolver(recipe)}>
                        <a>{RichText.asText(recipe.data.title)}</a>
                      </Link>
                    </li>
                  ))}
                </ul>
                <PaginationMenu {...{ totalCount, pageSize, page }} />
              </>
            ) : (
              <h1>No results found for &quot;{term}&quot;.</h1>
            )}
          </div>
        ) : (
          <div className="col-12">
            <h1>Search</h1>
            <p>Use the search bar to find recipes.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Search;

Search.getInitialProps = async (context) => {
  const { req, res, query } = context;
  const page = query?.page || 1;

  if (res) res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

  if (!!query?.search?.length) {
    const term = query.search.replace(/"/g, '');
    const { results, total_results_size } = await fetchRecipesBySearchTerm({
      term,
      req,
      options: { orderings: '[my.recipe.title]', pageSize: QUERY_SIZE, page },
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
