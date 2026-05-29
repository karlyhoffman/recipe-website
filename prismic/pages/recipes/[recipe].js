import Image from 'next/image';
import { createClient } from 'prismicio';
import * as prismicH from '@prismicio/helpers';
import { PrismicRichText, PrismicText, PrismicLink } from '@prismicio/react';
import classNames from 'classnames';
import { Row, Column } from 'components';
import styles from 'styles/pages/recipe-detail.module.scss';

function formatTime(time) {
  const hours = Math.floor(time / 60);
  const minutes = time % 60 < 10 ? `0${time % 60}` : time % 60;
  return `${hours}:${minutes}`;
}

export default function RecipeDetail({
  body: instructions = [],
  cuisine_tags = [],
  ingredient_slices: ingredients = [],
  main_ingredient_tags = [],
  minutes_prep: prepTime,
  minutes_total: totalTime,
  recipe_photo: photo,
  recipe_notes: notes,
  related_recipes = [],
  season_tags = [],
  servings,
  source,
  title = '',
  type_tags = [],
  weekday_tag: weekdayTag = 'No',
}) {
  return (
    <>
      {photo?.url && (
        <div className={styles.recipe__hero}>
          <Image priority className={styles.recipe__hero__img} src={photo.url} alt={photo.alt || ''} fill />{' '}
        </div>
      )}

      <div className={classNames(styles.recipe__wrapper)}>
        <Row className={styles.recipe__meta}>
          <Column>
            <h1 className="highlight">{title ? <PrismicText field={title} /> : 'Recipe Page'}</h1>
          </Column>

          {prepTime && (
            <Column md={6} lg={4}>
              <p>
                <strong>Prep</strong>: {formatTime(prepTime)}
              </p>
            </Column>
          )}

          {totalTime && (
            <Column md={6} lg={4}>
              <p>
                <strong>Total Time</strong>: {formatTime(totalTime)}
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

          {!!prismicH.asText(notes)?.length && (
            <Column className={styles.notes}>
              <strong>Notes:</strong>
              <PrismicRichText field={notes} />
            </Column>
          )}

          {!!prismicH.asText(source)?.length && (
            <Column className={styles.source}>
              <p className={styles.label}>Source:</p>
              <PrismicRichText field={source} />
            </Column>
          )}
        </Row>

        <Row className={styles.recipe__body}>
          <Column md={4} className={styles.ingredients}>
            <h2 className="h4 outline">Ingredients</h2>
            <div className={styles.sticky_wrapper}>
              {ingredients && ingredients.map((ingredient, i) => <DynamicTextZone key={`ing-${i}`} {...ingredient} />)}
            </div>
          </Column>

          <Column md={8} className={styles.instructions}>
            <h2 className="h4 outline">Instructions</h2>
            <div className={styles.sticky_wrapper}>
              {instructions &&
                instructions.map((instruction, i) => <DynamicTextZone key={`ins-${i}`} {...instruction} />)}
            </div>
          </Column>
        </Row>

        {!!related_recipes.length && (
          <Row className={styles.recipe__related}>
            <Column>
              <h2 className="h4 outline">Related</h2>
              <ul className="recipe-list">
                {related_recipes.map((recipe) => {
                  const { related_recipe, related_recipe: { id, data: { title } = {} } = {} } = recipe;
                  return (
                    <li key={id}>
                      <PrismicLink document={related_recipe} className="h5 highlight">
                        {title ? <PrismicText field={title} /> : 'Recipe Page'}
                      </PrismicLink>
                    </li>
                  );
                })}
              </ul>
            </Column>
          </Row>
        )}

        <Row className={styles.recipe__tags}>
          <Column>
            <h2 className="h4 outline">Tags</h2>
          </Column>

          {!!main_ingredient_tags?.length && (
            <Column md={3} className={styles.tag_column}>
              <h3 className="h5 highlight">Ingredients</h3>

              <ul className="recipe-list">
                {main_ingredient_tags.map((tag) => {
                  const { ingredient_tag: doc, ingredient_tag: { id, data: { ingredient_tag } = {} } = {} } = tag;
                  return (
                    <li key={id}>
                      <PrismicLink document={doc} className="h6 outline">
                        {ingredient_tag}
                      </PrismicLink>
                    </li>
                  );
                })}
              </ul>
            </Column>
          )}

          {!!cuisine_tags?.length && (
            <Column md={3} className={styles.tag_column}>
              <h3 className="h5 highlight">Cuisine</h3>

              <ul className="recipe-list">
                {cuisine_tags.map((tag) => {
                  const { cuisine_tag: doc, cuisine_tag: { data: { cuisine_tag } = {} } = {} } = tag;
                  return (
                    <li key={cuisine_tag}>
                      <PrismicLink document={doc} className="h6 outline">
                        {cuisine_tag}
                      </PrismicLink>
                    </li>
                  );
                })}
              </ul>
            </Column>
          )}

          {(!!type_tags?.length || weekdayTag === 'Yes') && (
            <Column md={3} className={styles.tag_column}>
              <h3 className="h5 highlight">Dish Type</h3>

              <ul className="recipe-list">
                {type_tags.map((tag) => {
                  const { type_tag: doc, type_tag: { data: { type_tag } = {} } = {} } = tag;
                  return (
                    <li key={type_tag}>
                      <PrismicLink document={doc} className="h6 outline">
                        {type_tag}
                      </PrismicLink>
                    </li>
                  );
                })}
                {weekdayTag === 'Yes' && (
                  <li>
                    <PrismicLink href="/recipes/weekday" className="h6 outline">
                      Weekday Meal
                    </PrismicLink>
                  </li>
                )}
              </ul>
            </Column>
          )}

          {!!season_tags?.length && (
            <Column md={3} className={styles.tag_column}>
              <h3 className="h5 highlight">Season</h3>
              <ul className="recipe-list">
                {season_tags.map((tag) => {
                  const { season_tag: doc, season_tag: { data: { season_tag } = {} } = {} } = tag;
                  return (
                    <li key={season_tag}>
                      <PrismicLink document={doc} className="h6 outline">
                        {season_tag}
                      </PrismicLink>
                    </li>
                  );
                })}
              </ul>
            </Column>
          )}
        </Row>
      </div>
    </>
  );
}

const fetchLinks = [
  'recipe.title',
  'cuisine_tag.cuisine_tag',
  'ingredient_tag.ingredient_tag',
  'type_tag.type_tag',
  'season_tag.season_tag',
];

export const getStaticProps = async ({ params, previewData }) => {
  const { recipe: uid } = params;
  const client = createClient({ previewData });
  const { data } = (await client.getByUID('recipe', uid, { fetchLinks })) || {};

  if (!data) return { notFound: true };

  return {
    props: {
      ...data,
    },
    revalidate: 10,
  };
};

export async function getStaticPaths() {
  const client = createClient();
  const pages = await client.getAllByType('recipe');

  return {
    paths: pages.map((page) => prismicH.asLink(page)),
    fallback: 'blocking',
  };
}

function DynamicTextZone(props) {
  const { slice_type, primary } = props;

  const res = (() => {
    switch (slice_type) {
      case 'ingredient_heading':
        return (
          <div className={styles.heading_block}>
            <h3 className="h5 highlight">
              <PrismicText field={primary.ingredient_heading} />
            </h3>
          </div>
        );

      case 'ingredient':
        return <PrismicRichText field={primary.ingredient} />;

      case 'instruction_heading':
        return (
          <div className={styles.heading_block}>
            <h3 className="h5 highlight">
              <PrismicText field={primary.instruction_heading} />
            </h3>
          </div>
        );

      case 'recipe_instruction':
        return <PrismicRichText field={primary.instruction} />;

      default:
        return null;
    }
  })();

  return res;
}
