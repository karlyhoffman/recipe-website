import { createClient } from 'prismicio';
import * as prismicH from '@prismicio/helpers';
import { Row, Column } from 'components';
import styles from 'styles/pages/groceries.module.scss';

const GROCERY_AISLES = {
  'Beer and Wine': [],
  Produce: [],
  Deli: [],
  Bread: [],
  Seafood: [],
  Meats: [],
  Cheese: [],
  'World Aisle': [],
  Pasta: [],
  Soup: [],
  Spices: [],
  Baking: [],
  Cereal: [],
  Chips: [],
  Soda: [],
  Frozen: [],
  Dairy: [],
  Other: [],
};

export default function Groceries({ ingredients }) {
  return (
    <Row className={styles.groceries}>
      <Column>
        <h1 className="h2 outline">Grocery List</h1>
      </Column>

      {Object.entries(ingredients).map(([aisle, list], i) => {
        if (!list.length) return null;
        return (
          <Column lg={6} className={styles.groceries__section} key={`${aisle}-${i}`}>
            <h2 className="h4 outline">{aisle}</h2>
            <ul>
              {list.map(({ ingredient }, j) => (
                <li key={`${ingredient}-${i}-${j}`} dangerouslySetInnerHTML={{ __html: ingredient }} />
              ))}
            </ul>
          </Column>
        );
      })}
    </Row>
  );
}

export const getStaticProps = async ({ previewData }) => {
  const client = createClient({ previewData });
  const { results = [] } =
    (await client.getByType('cook_next_list', { fetchLinks: ['recipe.ingredient_slices'] })) || {};

  const sortedIngredients =
    results[0]?.data?.next_recipes?.reduce((acc, { next_recipe: recipe }) => {
      const ingredients = recipe.data.ingredient_slices
        .filter(({ slice_type }) => slice_type === 'ingredient')
        .map(({ primary }) => ({ ...primary, ingredient: prismicH.asHTML(primary.ingredient) }));

      ingredients.forEach((ingredient) => {
        const aisleName = acc[ingredient.aisle] || acc['Other'];
        aisleName.push(ingredient);
        aisleName.sort(sortByBoldText);
      });

      return acc;
    }, GROCERY_AISLES) || GROCERY_AISLES;

  return {
    props: {
      ingredients: sortedIngredients || [],
    },
    revalidate: 10,
  };
};

function sortByBoldText(a, b) {
  const aIngredient = a.ingredient
    .substring(a.ingredient.indexOf('<strong>') + '<strong>'.length, a.ingredient.lastIndexOf('</strong>'))
    .toLowerCase();

  const bIngredient = b.ingredient
    .substring(b.ingredient.indexOf('<strong>') + '<strong>'.length, b.ingredient.lastIndexOf('</strong>'))
    .toLowerCase();

  if (aIngredient < bIngredient) {
    return -1;
  }

  if (aIngredient > bIngredient) {
    return 1;
  }

  return 0;
}
