import classNames from 'classnames';
import { createClient } from 'prismicio';
import { PrismicText, PrismicLink } from '@prismicio/react';
import { Row, Column } from 'components';
import styles from 'styles/pages/homepage.module.scss';

export default function Homepage({
  nextRecipes = [],
  favoriteRecipes = [],
  recentlyAddedRecipes = [],
  randomRecipes = [],
}) {
  return (
    <Row id={styles.homepage}>
      <h1 className="sr-only">Recipe Website</h1>

      <Column className={classNames(styles.group, styles.group__featured)}>
        <h2 className="h4 outline">Recipes to Cook Next</h2>
        <ul>
          {nextRecipes.map(({ next_recipe }) => (
            <li key={next_recipe.id}>
              <PrismicLink field={next_recipe} className="h4 highlight">
                <PrismicText field={next_recipe.data.title} />
              </PrismicLink>
            </li>
          ))}
        </ul>
      </Column>

      <Column md={6} className={classNames(styles.group, styles.group__subgroup)}>
        <div className={styles.group__wrapper}>
          <h2 className="h4 outline">Current Favorites</h2>
          <ul>
            {favoriteRecipes.map(({ favorite_recipe }) => (
              <li key={favorite_recipe.id}>
                <PrismicLink field={favorite_recipe} className="h5 highlight">
                  <PrismicText field={favorite_recipe.data.title} />
                </PrismicLink>
              </li>
            ))}
          </ul>
        </div>
      </Column>

      <Column md={6} className={classNames(styles.group, styles.group__subgroup)}>
        <div className={styles.group__wrapper}>
          <h2 className="h4 outline">Recently Added</h2>
          <ul>
            {recentlyAddedRecipes.map((recent_recipe) => (
              <li key={recent_recipe.id}>
                <PrismicLink document={recent_recipe} className="h5 highlight">
                  <PrismicText field={recent_recipe.data.title} />
                </PrismicLink>
              </li>
            ))}
          </ul>
        </div>
      </Column>

      <Column md={9} className={classNames(styles.group, styles.group__subgroup)}>
        <h2 className="h4 outline">Ideas for Next Week</h2>
        <ul>
          {randomRecipes.map((random_recipe) => (
            <li key={random_recipe.id}>
              <PrismicLink document={random_recipe} className="h6 highlight">
                <PrismicText field={random_recipe.data.title} />
              </PrismicLink>
            </li>
          ))}
        </ul>
      </Column>
    </Row>
  );
}

const pageSize = 10;
const fetchLinks = ['recipe.title'];

function randomPageNumber(num) {
  const min = 2; // page other than first page (used for recentlyAddedRecipes)
  const max = num - 1; // skip last page (will have fewer results)
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export async function getStaticProps({ previewData }) {
  const client = createClient({ previewData });
  const { total_pages = 1 } = (await client.getByType('recipe')) || {};

  const [nextRecipesData, favoriteRecipesData, recentlyAddedRecipes, randomRecipes] = await Promise.all([
    client.getSingle('cook_next_list', { fetchLinks }),
    client.getSingle('favorites_list', { fetchLinks }),
    client.getByType('recipe', {
      orderings: {
        field: 'document.first_publication_date',
        direction: 'desc',
      },
      page: 1,
      pageSize,
    }),
    client.getByType('recipe', {
      orderings: {
        field: 'document.first_publication_date',
        direction: 'desc',
      },
      page: randomPageNumber(total_pages),
      pageSize,
    }),
  ]);

  return {
    props: {
      nextRecipes: nextRecipesData?.data?.next_recipes || [],
      favoriteRecipes: favoriteRecipesData?.data?.favorite_recipes || [],
      recentlyAddedRecipes: recentlyAddedRecipes?.results || [],
      randomRecipes: randomRecipes?.results || [],
    },
    revalidate: 10,
  };
}
