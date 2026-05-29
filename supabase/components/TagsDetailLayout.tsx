import Link from 'next/link';
import { Row, Column } from '@/components/Grid';
import { highlightStyle, randomColorStart } from '@/utils/highlight';
import type { RecipeSummary } from '@/types';

interface Props {
  recipes: RecipeSummary[];
  tagName: string;
}

export default function TagsDetailLayout({ recipes, tagName }: Props) {
  const headline = tagName ? `${tagName} Recipes` : 'Recipes by Tag';
  const start = randomColorStart();

  return (
    <Row>
      <Column>
        <h1 className="h4 outline">{headline}</h1>
        {recipes.length > 0 ? (
          <ul className="recipe-list">
            {recipes.map((recipe, i) => (
              <li key={recipe.id}>
                <Link href={`/recipes/${recipe.uid}`} className="h5 highlight" style={highlightStyle(i, start)}>
                  {recipe.title}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            <strong>No recipes found.</strong>
          </p>
        )}
      </Column>
    </Row>
  );
}
