import Link from 'next/link';
// import { RichText } from 'prismic-reactjs';
// import { linkResolver } from 'api/prismic-configuration';
// import { fetchMultipleDocumentsByType } from 'api/prismic-queries';
import { Row, Column, PaginationMenu } from 'components';
import styles from 'styles/pages/recipe-overview.module.scss';

const QUERY_SIZE = 100;

function RecipesOverview({ recipes = [], totalCount, page, pageSize }) {
  return (
    <Row className={styles.recipes}>
      <Column>
        <h1 className="h4 outline">Recipes by Category</h1>
        <ul className={styles.recipes__categories}>
          <li>
            <Link className="h4 highlight" href="/recipes/ingredients">
              Ingredients
            </Link>
          </li>
          <li>
            <Link className="h4 highlight" href="/recipes/cuisines">
              Cuisines
            </Link>
          </li>
          <li>
            <Link className="h4 highlight" href="/recipes/dish-types">
              Dish Types
            </Link>
          </li>
          <li>
            <Link className="h4 highlight" href="/recipes/seasons">
              Seasons
            </Link>
          </li>
          <li>
            <Link className="h4 highlight" href="/recipes/weekday">
              Weekday Meals
            </Link>
          </li>
        </ul>

        <h2 className="h4 outline">All Recipes</h2>
        <ul className={styles.recipes__recipes}>
          <li>
            <a className="h5 highlight" href="/recipes/spicy-adobo-shrimp-cocktail">
              Spicy Adobo Shrimp Cocktail
            </a>
          </li>
          <li>
            <a className="h5 highlight" href="/recipes/lemon-gnocchi-with-spinach-and-peas">
              Lemon Gnocchi with Spinach and Peas
            </a>
          </li>
          <li>
            <a className="h5 highlight" href="/recipes/whole-roasted-cauliflower-with-pistachio-pesto">
              Whole Roasted Cauliflower With Pistachio Pesto
            </a>
          </li>
          <li>
            <a className="h5 highlight" href="/recipes/spaghetti-bolognese">
              Spaghetti Bolognese
            </a>
          </li>
          <li>
            <a className="h5 highlight" href="/recipes/double-tomato-bruschetta">
              Double Tomato Bruschetta
            </a>
          </li>
          <li>
            <a className="h5 highlight" href="/recipes/pasta-alla-norma">
              Pasta alla Norma
            </a>
          </li>
        </ul>

        {/* {!!recipes.length ? (
          <ul className={styles.recipe_list}>
            {recipes.map((recipe, index) => (
              <li key={recipe?.id || index}>
                <Link href={linkResolver(recipe)} className="h5 highlight">
                  {RichText.asText(recipe?.data?.title)}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>No recipes found.</p>
        )} */}
        <PaginationMenu {...{ totalCount, pageSize, page }} />
      </Column>
    </Row>
  );
}

export default RecipesOverview;

// RecipesOverview.getInitialProps = async (context) => {
//   const { req, res, query } = context;
//   const page = query?.page || 1;

//   const recipes = await fetchMultipleDocumentsByType({
//     type: 'recipe',
//     req,
//     options: {
//       orderings: '[my.recipe.title]',
//       pageSize: QUERY_SIZE,
//       page,
//     },
//   });

//   if (res) res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

//   return {
//     recipes: recipes.results || [],
//     totalCount: recipes.total_results_size || 0,
//     pageSize: QUERY_SIZE,
//     page,
//   };
// };
