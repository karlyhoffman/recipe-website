import Link from 'next/link';
import { Row, Column } from '@/components/Grid';
import PaginationMenu from '@/components/PaginationMenu';
import { recipes } from '@/lib/placeholder-data';
import styles from '@/styles/pages/recipe-overview.module.scss';

const PAGE_SIZE = 60;

export default async function RecipesOverview({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam) || 1;
  const allRecipes = recipes;

  return (
    <Row className={styles.recipes}>
      <Column>
        <h1 className="h3 outline">Recipes by Category</h1>
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

        {allRecipes.length > 0 ? (
          <ul className="recipe-list">
            {allRecipes.map((recipe) => (
              <li key={recipe.id}>
                <Link href={`/recipes/${recipe.uid}`} className="h5 highlight">
                  {recipe.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>No recipes found.</p>
        )}

        <PaginationMenu totalCount={allRecipes.length} pageSize={PAGE_SIZE} page={page} />
      </Column>
    </Row>
  );
}
