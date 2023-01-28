import classNames from 'classnames';
import { createClient } from 'prismicio';
import { PrismicRichText, PrismicText, PrismicLink } from '@prismicio/react';
import * as prismicH from '@prismicio/helpers';
import { Row, Column } from 'components';
import styles from 'styles/pages/groceries.module.scss';

export default function Groceries({ recipes }) {
  const ingredients = sortIngredientsByAisle(recipes);

  return (
    <Row className={styles.groceries}>
      <Column>
        <h1 className="h2 outline">Grocery List</h1>
        <ul className="recipe-list">
          {recipes.map(({ next_recipe: recipe }, i) => (
            <li key={recipe?.id || i}>
              <PrismicLink document={recipe} className="h6 highlight">
                <PrismicText field={recipe?.data?.title} />
              </PrismicLink>
            </li>
          ))}
        </ul>
      </Column>

      {ingredients.map(([aisle, list]) => {
        if (!list.length) return null;
        return (
          <Column lg={aisle === 'Other' ? 12 : 6} className={styles.groceries__section} key={aisle}>
            <div className={classNames(styles.wrapper, 'outline')}>
              <h2 className="h4 highlight">{aisle}</h2>
              <ul>
                {list.map(({ ingredient, key }) => (
                  <li key={key}>
                    <PrismicRichText field={ingredient} />
                  </li>
                ))}
              </ul>
            </div>
          </Column>
        );
      })}
    </Row>
  );
}

export async function getStaticProps({ previewData }) {
  const client = createClient({ previewData });
  const pageData = await client.getByType('cook_next_list', {
    fetchLinks: ['recipe.title', 'recipe.ingredient_slices'],
  });

  return {
    props: {
      recipes: pageData?.results[0]?.data?.next_recipes || [],
    },
    revalidate: 10,
  };
}

function sortIngredientsByAisle(recipes = []) {
  const ingredientsObj = recipes?.reduce(
    (acc, { next_recipe, next_recipe: { id, data } }) => {
      const ingredients = data.ingredient_slices
        .filter(({ slice_type }) => slice_type === 'ingredient')
        .map(({ primary }) => {
          return {
            ...primary,
            recipe: next_recipe,
            ingredientText: prismicH.asHTML(primary.ingredient),
            key: (id + prismicH.asHTML(primary.ingredient)).replace(/[^A-Z0-9]+/gi, '_'),
          };
        });

      ingredients.forEach((ingredient) => {
        const aisleName = ingredient.aisle || 'Other';
        const aisleData = acc[aisleName];
        aisleData.push(ingredient);
        aisleData.sort(sortByBoldText);

        acc[aisleName] = aisleData;
      });

      return acc;
    },
    {
      'Beer and Wine': [],
      Produce: [],
      Deli: [],
      Bread: [],
      Seafood: [],
      Meat: [],
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
    }
  );

  return Object.entries(ingredientsObj);
}

function sortByBoldText(a, b) {
  const aIngredient = a.ingredientText
    .substring(a.ingredientText.indexOf('<strong>') + '<strong>'.length, a.ingredientText.lastIndexOf('</strong>'))
    .toLowerCase();

  const bIngredient = b.ingredientText
    .substring(b.ingredientText.indexOf('<strong>') + '<strong>'.length, b.ingredientText.lastIndexOf('</strong>'))
    .toLowerCase();

  if (aIngredient < bIngredient) {
    return -1;
  }

  if (aIngredient > bIngredient) {
    return 1;
  }

  return 0;
}
