import classNames from 'classnames';
import Link from 'next/link';
import { Row, Column } from '@/components/Grid';
import { getCookNextRecipes } from '@/lib/data';
import { highlightStyle, randomColorStart } from '@/utils/highlight';
import type { Recipe } from '@/types';
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

function sortIngredientsByAisle(recipes: Recipe[]) {
  const aisleMap: Record<string, { name: string; aisle: string; recipeTitle: string; recipeUid: string }[]> = {};
  AISLE_ORDER.forEach((aisle) => (aisleMap[aisle] = []));

  recipes.forEach((recipe) => {
    recipe.ingredients
      .filter((s) => s.type === 'ingredient')
      .forEach((slice) => {
        const aisle = slice.aisle || 'Other';
        if (!aisleMap[aisle]) aisleMap[aisle] = [];
        aisleMap[aisle].push({
          name: slice.name,
          aisle,
          recipeTitle: recipe.title,
          recipeUid: recipe.uid,
        });
      });
  });

  return Object.entries(aisleMap);
}

export default async function Groceries() {
  const cookNextRecipes = await getCookNextRecipes();
  const aisles = sortIngredientsByAisle(cookNextRecipes);
  const start = randomColorStart();

  return (
    <Row className={styles.groceries}>
      <Column>
        <h1 className="h2 outline">Grocery List</h1>
        <ul className="recipe-list">
          {cookNextRecipes.map((recipe, i) => (
            <li key={recipe.id}>
              <Link href={`/recipes/${recipe.uid}`} className="h6 highlight" style={highlightStyle(i, start)}>
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
                    <p>{item.name}</p>
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
