import classNames from 'classnames';
import Link from 'next/link';
import { Row, Column } from '@/components/Grid';
import { getNextRecipes, getFavoriteRecipes, getRecentRecipes, getRandomRecipes } from '@/lib/data';
import { highlightStyle, randomColorStart } from '@/utils/highlight';
import styles from '@/styles/pages/homepage.module.scss';

export default async function Homepage() {
  const [nextRecipes, favoriteRecipes, recentRecipes, randomRecipes] = await Promise.all([
    getNextRecipes(),
    getFavoriteRecipes(),
    getRecentRecipes(),
    getRandomRecipes(),
  ]);
  const start = randomColorStart();

  return (
    <Row id={styles.homepage}>
      <h1 className="sr-only">Recipe Website</h1>

      <Column className={classNames(styles.group, styles.group__featured)}>
        <h2 className="h4 outline">Recipes to Cook Next</h2>
        <ul>
          {nextRecipes.map((recipe, i) => (
            <li key={recipe.id}>
              <Link href={`/recipes/${recipe.uid}`} className="h4 highlight" style={highlightStyle(i, start)}>
                {recipe.title}
              </Link>
            </li>
          ))}
        </ul>
      </Column>

      <Column md={6} className={classNames(styles.group, styles.group__subgroup)}>
        <div className={styles.group__wrapper}>
          <h2 className="h4 outline">Current Favorites</h2>
          <ul>
            {favoriteRecipes.map((recipe, i) => (
              <li key={recipe.id}>
                <Link href={`/recipes/${recipe.uid}`} className="h5 highlight" style={highlightStyle(i, start)}>
                  {recipe.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Column>

      <Column md={6} className={classNames(styles.group, styles.group__subgroup)}>
        <div className={styles.group__wrapper}>
          <h2 className="h4 outline">Recently Added</h2>
          <ul>
            {recentRecipes.map((recipe, i) => (
              <li key={recipe.id}>
                <Link href={`/recipes/${recipe.uid}`} className="h5 highlight" style={highlightStyle(i, start)}>
                  {recipe.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Column>

      <Column md={9} className={classNames(styles.group, styles.group__subgroup)}>
        <h2 className="h4 outline">Ideas for Next Week</h2>
        <ul>
          {randomRecipes.map((recipe, i) => (
            <li key={recipe.id}>
              <Link href={`/recipes/${recipe.uid}`} className="h6 highlight" style={highlightStyle(i, start)}>
                {recipe.title}
              </Link>
            </li>
          ))}
        </ul>
      </Column>
    </Row>
  );
}
