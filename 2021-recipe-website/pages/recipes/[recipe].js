import { Fragment } from 'react';
import Link from 'next/link';
import classNames from 'classnames';
import { RichText } from 'prismic-reactjs';
import { linkResolver } from 'api/prismic-configuration';
import {
  fetchSingleDocumentByTypeAndUID,
  fetchMultipleDocumentsByID,
  fetchUIDsForType,
} from 'api/prismic-queries';
import styles from 'styles/pages/recipe-detail.module.scss';

function formatTime (time) {
  const hours = Math.floor(time / 60);
  const minutes = time % 60 < 10 ? `0${time % 60}` : time % 60;
  return `${hours}:${minutes}`;
};

function renderTextSlice ({ slice_type, primary }) {
  switch (slice_type) {
    case 'ingredient_heading':
      return RichText.render(primary.ingredient_heading);
    case 'ingredient':
      return RichText.render(primary.ingredient, linkResolver);
    case 'instruction_heading':
      return RichText.render(primary.instruction_heading);
    case 'recipe_instruction':
      return RichText.render(primary.instruction, linkResolver);
    default:
      return null;
  }
};

function RecipeDetail({
  recipe: {
    body: instructions = [],
    cost,
    ingredient_slices: ingredients = [],
    minutes_prep: prepTime,
    minutes_total: totalTime,
    recipe_photo: photo,
    recipe_notes: notes,
    servings,
    source,
    title,
    weekday_tag: weekdayTag = 'No',
  },
  tags,
}) {
  function filterTagsByType(type) {
    return tags.filter((tag) => tag.type === type);
  }

  return (
    <div id={styles.recipe_detail} className="container-fluid px-0">
      {photo?.url && (
        <div
          className={styles.hero_img}
          style={{ backgroundImage: `url(${photo.url})` }}
        />
      )}

      <div
        className={classNames(styles.body, 'container-fluid', {
          [styles.has_hero_img]: photo?.url,
        })}
      >
        <div className="container">
          <div className="row">
            <div className="col-12">
              <h1>{RichText.asText(title)}</h1>
            </div>
          </div>
          <div className={classNames(styles.about, 'row')}>
            <div className="col-12 col-md-6 col-lg-3">
              {prepTime && (
                <p>
                  <strong>Prep</strong>: {formatTime(prepTime)}
                </p>
              )}
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              {totalTime && (
                <p>
                  <strong>Total Time</strong>: {formatTime(totalTime)}
                </p>
              )}
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              {servings && (
                <p>
                  <strong>Servings</strong>: {servings}
                </p>
              )}
            </div>
            <div className="col-12 col-md-6 col-lg-3">
              {cost && (
                <p>
                  <strong>Estimated Cost</strong>: ${cost}
                </p>
              )}
            </div>
            {notes && RichText.asText(notes) && (
              <div className={classNames(styles.notes, 'col-12')}>
                <strong>Notes:</strong>
                {RichText.render(notes)}
              </div>
            )}
            {!!source?.length && (
              <div className={classNames(styles.source, 'col-12')}>
                <p className={styles.label}>Source:</p>
                {RichText.render(source)}
              </div>
            )}
            <div className="col-12">
              <div className={styles.line} />
            </div>
          </div>
        </div>

        <div className="container">
          <div className={classNames(styles.steps, 'row')}>
            <div className={classNames(styles.ingredients, 'col-12 col-md-4')}>
              <h2 className={styles.heading}>Ingredients</h2>
              <div className={styles.ingredient_menu}>
                {ingredients &&
                  ingredients.map((ingredient, i) => (
                    <Fragment key={`ingredient-${i}`}>
                      {renderTextSlice(ingredient)}
                    </Fragment>
                  ))}
              </div>
            </div>

            <div className={classNames(styles.instructions, 'col-12 col-md-8')}>
              <div>
                <h2 className={styles.heading}>Instructions</h2>
                {instructions &&
                  instructions.map((instruction, i) => (
                    <Fragment key={`instruction-${i}`}>
                      {renderTextSlice(instruction)}
                    </Fragment>
                  ))}
              </div>
            </div>
            <div className="col-12">
              <div className={styles.line} />
            </div>
          </div>

          {!!filterTagsByType('recipe').length && (
            <div className={classNames(styles.related, 'row')}>
              <div className="col-12">
                <h2>Related Recipes</h2>
                <ul>
                  {filterTagsByType('recipe').map(
                    ({ id, uid, type, data: { title } }) => (
                      <li key={id}>
                        <Link href={linkResolver({ type, uid })}>
                          <a className={styles.card}>
                            {RichText.asText(title)}
                          </a>
                        </Link>
                      </li>
                    )
                  )}
                </ul>
              </div>
              <div className="col-12">
                <div className={styles.line} />
              </div>
            </div>
          )}

          <div className={classNames(styles.tags, 'row')}>
            <div className="col-12">
              <h2>Tags</h2>
            </div>

            {!!filterTagsByType('ingredient_tag').length && (
              <div className="col-12 col-md-3">
                <h3>Ingredients</h3>
                <ul>
                  {filterTagsByType('ingredient_tag').map(
                    ({ id, uid, type, data: { ingredient_tag } }) => (
                      <li key={id}>
                        <Link href={linkResolver({ type, uid })}>
                          <a
                            className={classNames(
                              styles.tag,
                              styles.ingredient
                            )}
                          >
                            {ingredient_tag}
                          </a>
                        </Link>
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {!!filterTagsByType('cuisine_tag').length && (
              <div className="col-12 col-md-3">
                <h3>Cuisine</h3>
                <ul>
                  {filterTagsByType('cuisine_tag').map(
                    ({ id, uid, type, data: { cuisine_tag } }) => (
                      <li key={id}>
                        <Link href={linkResolver({ type, uid })}>
                          <a className={classNames(styles.tag, styles.cuisine)}>
                            {cuisine_tag}
                          </a>
                        </Link>
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}

            {weekdayTag === 'Yes' ||
              (!!filterTagsByType('type_tag').length && (
                <div className="col-12 col-md-3">
                  <h3>Dish Type</h3>
                  <ul>
                    {filterTagsByType('type_tag').map(
                      ({ id, uid, type, data: { type_tag } }) => (
                        <li key={id}>
                          <Link href={linkResolver({ type, uid })}>
                            <a className={classNames(styles.tag, styles.type)}>
                              {type_tag}
                            </a>
                          </Link>
                        </li>
                      )
                    )}

                    {weekdayTag === 'Yes' && (
                      <li>
                        <Link href="/recipes/weekday">
                          <a className={classNames(styles.tag, styles.weekday)}>
                            Weekday Meal
                          </a>
                        </Link>
                      </li>
                    )}
                  </ul>
                </div>
              ))}

            {!!filterTagsByType('season_tag').length && (
              <div className="col-12 col-md-3">
                <h3>Season</h3>
                <ul>
                  {filterTagsByType('season_tag').map(
                    ({ id, uid, type, data: { season_tag } }) => (
                      <li key={id}>
                        <Link href={linkResolver({ type, uid })}>
                          <a className={classNames(styles.tag, styles.season)}>
                            {season_tag}
                          </a>
                        </Link>
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecipeDetail;

export const getStaticProps = async ({ params, preview = false, previewData = {} }) => {
  const { ref } = previewData;
  const { 'recipe': uid } = params;
  const recipe = await fetchSingleDocumentByTypeAndUID({
    type: 'recipe',
    uid,
    options: { ref },
  });

  if (!recipe?.data) return { notFound: true };

  const {
    related_recipes,
    cuisine_tags,
    main_ingredient_tags,
    type_tags,
    season_tags,
  } = recipe.data;

  let relatedRecipeIDs = [];
  let cuisineTagIDs = [];
  let ingredientTagIDs = [];
  let typeTagIDs = [];
  let seasonTagIDs = [];

  if (!!related_recipes.length) {
    relatedRecipeIDs = related_recipes.map((x) => x?.related_recipe?.id || null).filter((x) => x);
  }

  if (!!cuisine_tags.length) {
    cuisineTagIDs = cuisine_tags.map((x) => x?.cuisine_tag?.id || null).filter((x) => x);
  }

  if (!!main_ingredient_tags.length) {
    ingredientTagIDs = main_ingredient_tags.map((x) => x?.ingredient_tag?.id || null).filter((x) => x);
  }

  if (!!type_tags.length) {
    typeTagIDs = type_tags.map((x) => x?.type_tag?.id || null).filter((x) => x);
  }

  if (!!season_tags.length) {
    seasonTagIDs = season_tags.map((x) => x?.season_tag?.id || null).filter((x) => x);
  }

  const tagIDs = [
    ...relatedRecipeIDs,
    ...cuisineTagIDs,
    ...ingredientTagIDs,
    ...typeTagIDs,
    ...seasonTagIDs,
  ];

  let tags = [];

  if (!!tagIDs.length) {
    const tagsData = await fetchMultipleDocumentsByID({ ids: tagIDs, options: { ref } });
    tags = tagsData?.results || [];
  }

  return {
    props: {
      recipe: recipe.data,
      tags,
      preview,
    },
    revalidate: 1,
  };
};

export const getStaticPaths = async () => {
  const uids = await fetchUIDsForType({ type: 'recipe' });
  const paths = uids.map((uid) => `/recipes/${uid}`);
  return {
    paths,
    fallback: 'blocking',
  };
};
