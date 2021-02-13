import Link from 'next/link';
import { RichText } from 'prismic-reactjs';
import { linkResolver } from 'api/prismic-configuration';
import { fetchMultipleDocumentsByType } from 'api/prismic-queries';
import { PaginationMenu } from 'components';
import styles from 'styles/pages/recipe-overview.module.scss';

const QUERY_SIZE = 100;

function RecipesOverview({ recipes, totalCount, page, pageSize }) {
  return (
    <div id={styles.recipes_overview} className="container">
      <div className="row">
        <div className="col-12">
          <h1>Recipes</h1>
        </div>
        <div className="col-12">
          <h2>Tag Categories</h2>
          <ul>
            <li>
              <Link href="/recipes/ingredients">
                <a>Ingredients</a>
              </Link>
            </li>
            <li>
              <Link href="/recipes/cuisines">
                <a>Cuisines</a>
              </Link>
            </li>
            <li>
              <Link href="/recipes/dish-types">
                <a>Dish Types</a>
              </Link>
            </li>
            <li>
              <Link href="/recipes/seasons">
                <a>Seasons</a>
              </Link>
            </li>
            <li>
              <Link href="/recipes/weekday">
                <a>Weekday Meals</a>
              </Link>
            </li>
          </ul>
        </div>

        <div className="col-12">
          <h2>All Recipes</h2>
          {!!recipes.length ? (
            <ul className={styles.recipe_list}>
              {recipes.map((recipe, index) => (
                <li key={recipe?.id || index}>
                  <Link href={linkResolver(recipe)}>
                    <a>{RichText.asText(recipe?.data?.title)}</a>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>No recipes found.</p>
          )}

          <PaginationMenu {...{ totalCount, pageSize, page }} />
        </div>
      </div>
    </div>
  );
}

export default RecipesOverview;

RecipesOverview.getInitialProps = async (context) => {
  const { req, res, query } = context;
  const page = query?.page || 1;

  const recipes = await fetchMultipleDocumentsByType({
    type: 'recipe',
    req,
    options: {
      orderings: '[my.recipe.title]',
      pageSize: QUERY_SIZE,
      page,
    },
  });

  if (res) res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

  return {
    recipes: recipes.results || [],
    totalCount: recipes.total_results_size || 0,
    pageSize: QUERY_SIZE,
    page,
  };
};
