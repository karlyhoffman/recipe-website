import classNames from 'classnames';
import Link from 'next/link';
import { Row, Column } from '@/components/Grid';
import { cookNextRecipes } from '@/lib/placeholder-data';
import styles from '@/styles/pages/groceries.module.scss';

const AISLE_ORDER = [
  'Beer and Wine',
  'Produce',
  'Deli',
  'Bread',
  'Seafood',
  'Meat',
  'Cheese',
  'World Aisle',
  'Pasta',
  'Soup',
  'Spices',
  'Baking',
  'Cereal',
  'Chips',
  'Soda',
  'Frozen',
  'Dairy',
  'Other',
];

function sortIngredientsByAisle(recipes: typeof cookNextRecipes) {
  const aisleMap: Record<string, { text: string; aisle: string; recipeTitle: string; recipeUid: string }[]> = {};
  AISLE_ORDER.forEach((aisle) => (aisleMap[aisle] = []));

  recipes.forEach((recipe) => {
    recipe.ingredients
      .filter((s) => s.type === 'ingredient')
      .forEach((slice) => {
        const aisle = slice.aisle || 'Other';
        if (!aisleMap[aisle]) aisleMap[aisle] = [];
        aisleMap[aisle].push({
          text: slice.text,
          aisle,
          recipeTitle: recipe.title,
          recipeUid: recipe.uid,
        });
      });
  });

  return Object.entries(aisleMap);
}

export default function Groceries() {
  const aisles = sortIngredientsByAisle(cookNextRecipes);

  return (
    <Row className={styles.groceries}>
      <Column>
        <h1 className="h2 outline">Grocery List</h1>
        <ul className="recipe-list">
          {cookNextRecipes.map((recipe) => (
            <li key={recipe.id}>
              <Link href={`/recipes/${recipe.uid}`} className="h6 highlight">
                {recipe.title}
              </Link>
            </li>
          ))}
        </ul>
      </Column>

      {aisles.map(([aisle, items]) => {
        if (!items.length) return null;
        return (
          <Column
            lg={aisle === 'Other' ? 12 : 6}
            className={classNames(styles.groceries__section, {
              [styles.groceries__section__last]: aisle === 'Other',
            })}
            key={aisle}
          >
            <div className={classNames(styles.wrapper, 'outline')}>
              <h2 className="h4 highlight">{aisle}</h2>
              <ul>
                {items.map((item, i) => (
                  <li className={styles.ingredient} key={`${item.recipeUid}-${i}`}>
                    <p>{item.text}</p>
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
