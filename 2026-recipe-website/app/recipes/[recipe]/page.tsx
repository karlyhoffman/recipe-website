import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Row, Column } from '@/components/Grid';
import { getRecipeByUid, getAllRecipes } from '@/lib/data';
import { highlightStyle, randomColorStart } from '@/utils/highlight';
import type { IngredientSlice, InstructionSlice } from '@/types';
import styles from '@/styles/pages/recipe-detail.module.scss';

function formatTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}:${mins < 10 ? `0${mins}` : mins}` : `${mins} min`;
}

export default async function RecipeDetail({
  params,
}: {
  params: Promise<{ recipe: string }>;
}) {
  const { recipe: uid } = await params;
  const recipe = await getRecipeByUid(uid);

  if (!recipe) notFound();

  const start = randomColorStart();

  const {
    title,
    hero_image_url,
    prep_minutes,
    total_minutes,
    servings,
    notes,
    source,
    weekday,
    ingredients,
    instructions,
    cuisine_tags,
    ingredient_tags,
    type_tags,
    season_tags,
    related_recipes,
  } = recipe;

  const hasTags = cuisine_tags.length || ingredient_tags.length || type_tags.length || weekday || season_tags.length;

  return (
    <>
      {hero_image_url && (
        <div className={styles.recipe__hero}>
          <Image
            priority
            className={styles.recipe__hero__img}
            src={hero_image_url}
            alt={title}
            fill
          />
        </div>
      )}

      <div className={styles.recipe__wrapper}>
        <Row className={styles.recipe__meta}>
          <Column>
            <h1 className="highlight">{title}</h1>
          </Column>

          {prep_minutes && (
            <Column md={6} lg={4}>
              <p>
                <strong>Prep</strong>: {formatTime(prep_minutes)}
              </p>
            </Column>
          )}

          {total_minutes && (
            <Column md={6} lg={4}>
              <p>
                <strong>Total Time</strong>: {formatTime(total_minutes)}
              </p>
            </Column>
          )}

          {servings && (
            <Column md={6} lg={4}>
              <p>
                <strong>Servings</strong>: {servings}
              </p>
            </Column>
          )}

          {notes && (
            <Column className={styles.notes}>
              <strong>Notes:</strong>
              <p>{notes}</p>
            </Column>
          )}

          {source && (
            <Column className={styles.source}>
              <p className={styles.label}>Source:</p>
              <p>{source}</p>
            </Column>
          )}
        </Row>

        <Row className={styles.recipe__body}>
          <Column md={4} className={styles.ingredients}>
            <h2 className="h4 outline">Ingredients</h2>
            <div className={styles.sticky_wrapper}>
              {ingredients.map((slice, i) => (
                <IngredientSliceRenderer key={i} slice={slice} />
              ))}
            </div>
          </Column>

          <Column md={8} className={styles.instructions}>
            <h2 className="h4 outline">Instructions</h2>
            <div className={styles.sticky_wrapper}>
              {instructions.map((slice, i) => (
                <InstructionSliceRenderer key={i} slice={slice} />
              ))}
            </div>
          </Column>
        </Row>

        {related_recipes.length > 0 && (
          <Row className={styles.recipe__related}>
            <Column>
              <h2 className="h4 outline">Related</h2>
              <ul className="recipe-list">
                {related_recipes.map((r, i) => (
                  <li key={r.id}>
                    <Link href={`/recipes/${r.uid}`} className="h5 highlight" style={highlightStyle(i, start)}>
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </Column>
          </Row>
        )}

        {hasTags && (
          <Row className={styles.recipe__tags}>
            <Column>
              <h2 className="h4 outline">Tags</h2>
            </Column>

            {ingredient_tags.length > 0 && (
              <Column md={3} className={styles.tag_column}>
                <h3 className="h5 highlight">Ingredients</h3>
                <ul className="recipe-list">
                  {ingredient_tags.map((tag) => (
                    <li key={tag.id}>
                      <Link href={`/recipes/ingredients/${tag.uid}`} className="h6 outline">
                        {tag.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Column>
            )}

            {cuisine_tags.length > 0 && (
              <Column md={3} className={styles.tag_column}>
                <h3 className="h5 highlight">Cuisine</h3>
                <ul className="recipe-list">
                  {cuisine_tags.map((tag) => (
                    <li key={tag.id}>
                      <Link href={`/recipes/cuisines/${tag.uid}`} className="h6 outline">
                        {tag.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Column>
            )}

            {(type_tags.length > 0 || weekday) && (
              <Column md={3} className={styles.tag_column}>
                <h3 className="h5 highlight">Dish Type</h3>
                <ul className="recipe-list">
                  {type_tags.map((tag) => (
                    <li key={tag.id}>
                      <Link href={`/recipes/dish-types/${tag.uid}`} className="h6 outline">
                        {tag.name}
                      </Link>
                    </li>
                  ))}
                  {weekday && (
                    <li>
                      <Link href="/recipes/weekday" className="h6 outline">
                        Weekday Meal
                      </Link>
                    </li>
                  )}
                </ul>
              </Column>
            )}

            {season_tags.length > 0 && (
              <Column md={3} className={styles.tag_column}>
                <h3 className="h5 highlight">Season</h3>
                <ul className="recipe-list">
                  {season_tags.map((tag) => (
                    <li key={tag.id}>
                      <Link href={`/recipes/seasons/${tag.uid}`} className="h6 outline">
                        {tag.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Column>
            )}
          </Row>
        )}
      </div>
    </>
  );
}

function IngredientSliceRenderer({ slice }: { slice: IngredientSlice }) {
  if (slice.type === 'heading') {
    return (
      <div className={styles.heading_block}>
        <h3 className="h5 highlight">{slice.name}</h3>
      </div>
    );
  }
  return (
    <p>
      {slice.amount && `${slice.amount} `}<strong>{slice.name}</strong>{slice.preparation && `, ${slice.preparation}`}
    </p>
  );
}

function withBold(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
}

function InstructionSliceRenderer({ slice }: { slice: InstructionSlice }) {
  if (slice.type === 'heading') {
    return (
      <div className={styles.heading_block}>
        <h3 className="h5 highlight">{slice.text}</h3>
      </div>
    );
  }
  return <p>{withBold(slice.text)}</p>;
}

export async function generateStaticParams() {
  const recipes = await getAllRecipes();
  return recipes.map((r) => ({ recipe: r.uid }));
}
