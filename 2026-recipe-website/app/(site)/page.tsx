import classNames from 'classnames';
import Link from 'next/link';
import { Row, Column } from '@/components/Grid';
import { nextRecipes, favoriteRecipes, recentRecipes, randomRecipes } from '@/lib/placeholder-data';
import styles from '@/styles/pages/homepage.module.scss';

export default function Homepage() {
  return (
    <Row id={styles.homepage}>
      <h1 className="sr-only">Recipe Website</h1>

      <Column className={classNames(styles.group, styles.group__featured)}>
        <h2 className="h4 outline">Recipes to Cook Next</h2>
        <ul>
          {nextRecipes.map((recipe) => (
            <li key={recipe.id}>
              <Link href={`/recipes/${recipe.uid}`} className="h4 highlight">
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
            {favoriteRecipes.map((recipe) => (
              <li key={recipe.id}>
                <Link href={`/recipes/${recipe.uid}`} className="h5 highlight">
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
            {recentRecipes.map((recipe) => (
              <li key={recipe.id}>
                <Link href={`/recipes/${recipe.uid}`} className="h5 highlight">
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
          {randomRecipes.map((recipe) => (
            <li key={recipe.id}>
              <Link href={`/recipes/${recipe.uid}`} className="h6 highlight">
                {recipe.title}
              </Link>
            </li>
          ))}
        </ul>
      </Column>
    </Row>
  );
}
