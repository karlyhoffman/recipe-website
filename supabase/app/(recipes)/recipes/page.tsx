import Link from 'next/link';
import { Row, Column } from '@/components/Grid';
import PaginationMenu from '@/components/PaginationMenu';
import { getAllRecipes } from '@/lib/data';
import { highlightStyle, randomColorStart } from '@/utils/highlight';
import styles from '@/styles/pages/recipe-overview.module.scss';

const PAGE_SIZE = 60;

export default async function RecipesOverview({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam) || 1;
  const allRecipes = await getAllRecipes();
  const start = randomColorStart();

  return (
    <Row className={styles.recipes}>
      <Column>
        <h1 className="h3 outline">Recipes by Category</h1>
        <ul className={styles.recipes__categories}>
          <li>
            <Link className="h4 highlight" href="/recipes/ingredients" style={highlightStyle(0, start)}>
              Ingredients
            </Link>
          </li>
          <li>
            <Link className="h4 highlight" href="/recipes/cuisines" style={highlightStyle(1, start)}>
              Cuisines
            </Link>
          </li>
          <li>
            <Link className="h4 highlight" href="/recipes/dish-types" style={highlightStyle(2, start)}>
              Dish Types
            </Link>
          </li>
          <li>
            <Link className="h4 highlight" href="/recipes/seasons" style={highlightStyle(3, start)}>
              Seasons
            </Link>
          </li>
          <li>
            <Link className="h4 highlight" href="/recipes/weekday" style={highlightStyle(4, start)}>
              Weekday Meals
            </Link>
          </li>
        </ul>

        <h2 className="h4 outline">All Recipes</h2>

        {allRecipes.length > 0 ? (
          <ul className="recipe-list">
            {allRecipes.map((recipe, i) => (
              <li key={recipe.id}>
                <Link href={`/recipes/${recipe.uid}`} className="h5 highlight" style={highlightStyle(i, start)}>
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
