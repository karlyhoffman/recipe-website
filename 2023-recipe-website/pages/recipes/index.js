import Link from 'next/link';
import { createClient } from 'prismicio';
import { PrismicText, PrismicLink } from '@prismicio/react';
import { Row, Column, PaginationMenu } from 'components';
import styles from 'styles/pages/recipe-overview.module.scss';

const QUERY_SIZE = 60;

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

        {!!recipes.length ? (
          <ul className={styles.recipes__recipes}>
            {recipes.map((recipe, index) => (
              <li key={recipe?.id || index}>
                <PrismicLink document={recipe} className="h5 highlight">
                  <PrismicText field={recipe?.data?.title} />
                </PrismicLink>
              </li>
            ))}
          </ul>
        ) : (
          <p>No recipes found.</p>
        )}

        <PaginationMenu {...{ totalCount, pageSize, page }} />
      </Column>
    </Row>
  );
}

export default RecipesOverview;

export async function getServerSideProps({ query }) {
  const page = query?.page || 1;

  const recipes = await createClient().getByType('recipe', {
    orderings: { field: 'my.recipe.title' },
    pageSize: QUERY_SIZE,
    page,
  });

  return {
    props: {
      recipes: recipes.results || [],
      totalCount: recipes.total_results_size || 0,
      pageSize: QUERY_SIZE,
      page,
    },
  };
}
