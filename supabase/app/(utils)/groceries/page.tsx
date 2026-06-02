import classNames from 'classnames';
import Link from 'next/link';
import { Row, Column } from '@/components/Grid';
import { getCookNextRecipes } from '@/lib/data';
import { highlightStyle, randomColorStart } from '@/utils/highlight';
import type { Recipe } from '@/types';
import { AISLES } from '@/utils/aisles';
import styles from '@/styles/pages/groceries.module.scss';

const AISLE_ORDER = [...AISLES, 'Other'];

function sortIngredientsByAisle(recipes: Recipe[]) {
  const aisleMap: Record<string, { name: string; amount?: string; aisle: string; preparation?: string; recipeTitle: string; recipeUid: string }[]> = {};
  AISLE_ORDER.forEach((aisle) => (aisleMap[aisle] = []));

  recipes.forEach((recipe) => {
    recipe.ingredients
      .filter((s) => s.type === 'ingredient')
      .forEach(({ amount, name, aisle: aisleName, preparation }) => {
        const aisle = aisleName || 'Other';
        if (!aisleMap[aisle]) aisleMap[aisle] = [];
        aisleMap[aisle].push({
          name,
          amount,
          aisle,
          preparation,
          recipeTitle: recipe.title,
          recipeUid: recipe.uid
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

      <div className={styles.groceries__aisles}>
        {aisles.map(([aisle, items]) => {
          if (!items.length) return null;
          return (
            <div className={classNames(styles.aisle, 'outline')} key={aisle}>
              <h2 className="h4 highlight">{aisle}</h2>
              <ul>
                {items.map((item, i) => (
                  <li className={styles.ingredient} key={`${item.recipeUid}-${i}`}>
                    <p>{item.amount && `${item.amount} `}<strong>{item.name}</strong>{item.preparation && `, ${item.preparation}`}</p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Row>
  );
}
