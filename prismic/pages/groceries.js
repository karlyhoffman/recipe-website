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
          <Column
            lg={aisle === 'Other' ? 12 : 6}
            className={classNames(styles.groceries__section, { [styles.groceries__section__last]: aisle === 'Other' })}
            key={aisle}
          >
            <div className={classNames(styles.wrapper, 'outline')}>
              <h2 className="h4 highlight">{aisle}</h2>
              <ul>
                {list.map(({ ingredient, recipe, isDuplicate, id }) => (
                  <li className={styles.ingredient} key={id}>
                    <PrismicRichText field={ingredient} />
                    {isDuplicate && (
                      <span className={styles.recipe}>
                        (
                        <PrismicLink document={recipe}>
                          <PrismicText field={recipe?.data?.title} />
                        </PrismicLink>
                        )
                      </span>
                    )}
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
  return Object.entries(
    recipes?.reduce(
      (acc, { next_recipe, next_recipe: { id, data } }) => {
        const ingredients = data.ingredient_slices
          .filter(({ slice_type }) => slice_type === 'ingredient')
          .map(({ primary }) => {
            return {
              ...primary,
              recipe: next_recipe,
              ingredientText: prismicH.asHTML(primary.ingredient),
              id: (id + prismicH.asHTML(primary.ingredient)).replace(/[^A-Z0-9]+/gi, ''),
            };
          });

        ingredients.forEach((ingredient) => {
          const aisleName = ingredient.aisle || 'Other';
          const aisleData = acc[aisleName] || [];
          aisleData.push(ingredient);
          aisleData.sort(sortByBoldText);

          // Check for duplicate ingredients (if not in "Other" group):
          let duplicates = [];
          if (ingredient.aisle) {
            const lookup = aisleData.reduce((a, e) => {
              a[e.ingredientText] = ++a[e.ingredientText] || 0;
              return a;
            }, {});
            duplicates = aisleData.filter((e) => lookup[e.ingredientText]).map(({ id }) => id);
          }

          acc[aisleName] = !duplicates.length
            ? aisleData
            : aisleData.map((el) => (duplicates.includes(el.id) ? { ...el, isDuplicate: true } : el));
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
    )
  );
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
