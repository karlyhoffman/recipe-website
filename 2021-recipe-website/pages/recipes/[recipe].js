import { Fragment } from 'react';
import Link from 'next/link';
import classNames from 'classnames';
import { RichText } from 'prismic-reactjs';
import { linkResolver } from 'api/prismic-configuration';
import { fetchSingleDocumentByTypeAndUID, fetchUIDsForType } from 'api/prismic-queries';
import styles from 'styles/pages/recipe-detail.module.scss';

function RecipeDetail({ recipe }) {

  if (!recipe) return null;

  const {
    body: instructions = [],
    cost,
    cuisine_tags: cuisineTags,
    ingredient_slices: ingredients = [],
    main_ingredient_tags: ingredientTags,
    minutes_prep: prepTime,
    minutes_total: totalTime,
    recipe_photo: photo,
    recipe_notes: notes,
    related_recipes: relatedRecipes,
    season_tags: seasonTags,
    servings,
    source,
    title,
    type_tags: typeTags,
    weekday_tag: weekdayTag = 'No'
  } = recipe;

  const hasHeroImg = photo && photo.url;

  const formatTime = time => {
    const hours = Math.floor(time / 60);
    const minutes = time % 60 < 10 ? `0${time % 60}` : time % 60;
    return `${hours}:${minutes}`;
  };

  const renderTextSlice = ({ slice_type, primary }) => {
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

  return (
    <div id={styles.recipe_detail} className="container-fluid px-0">
      {hasHeroImg && (
        <div
          className={styles.hero_img}
          style={{ backgroundImage: `url(${photo.url})` }}
        />
      )}

      <div
        className={classNames(styles.body, 'container-fluid', {
          [styles.has_hero_img]: hasHeroImg,
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

          {/* TODO: Fetch Related Recipes */}
          {/* {!!relatedRecipes.length && (
            <div className={classNames(styles.related, 'row')}>
              <div className="col-12">
                <h2>Related Recipes</h2>
                <ul>
                  {relatedRecipes.map(({ related_recipe: related }) => (
                    <li key={related.id}>
                      <a
                        className={styles.card}
                        href={`/recipes/${related.uid}`}
                      >
                        {RichText.asText(related.title)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-12">
                <div className={styles.line} />
              </div>
            </div>
          )} */}

          {/* TODO: Fetch Tag Data */}
          <div className={classNames(styles.tags, 'row')}>
            {/* <div className="col-12">
              <h2>Tags</h2>
            </div> */}

            {/* {!!ingredientTags.length && (
              <div className="col-12 col-md-3">
                <h3>Ingredients</h3>
                <ul>
                  {ingredientTags.map(({ ingredient_tag: item }) => (
                    <li key={item.id}>
                      <Link href={`/recipes/ingredients/${item._meta.uid}`}>
                        <a className="tag ingredient">{item.ingredient_tag}</a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )} */}

            {/* {!!cuisineTags.length && (
              <div className="col-12 col-md-3">
                <h3>Cuisine</h3>
                <ul>
                  {cuisineTags.map(({ cuisine_tag: item }) => (
                    <li key={item._meta.id}>
                      <Link
                        href="/recipes/cuisines/[cuisine-tag]"
                        as={`/recipes/cuisines/${item._meta.uid}`}
                      >
                        <a className="tag cuisine">{item.cuisine_tag}</a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )} */}

            {/* {weekdayTag === 'Yes' ||
              (!!typeTags.length && (
                <div className="col-12 col-md-3">
                  <h3>Dish Type</h3>
                  <ul>
                    {typeTags.map(({ type_tag: item }) => (
                      <li key={item._meta.id}>
                        <Link href={`/recipes/dish-types/${item._meta.uid}`}>
                          <a className="tag type">{item.type_tag}</a>
                        </Link>
                      </li>
                    ))}

                    {weekdayTag === 'Yes' && (
                      <li>
                        <Link href="/recipes/weekday">
                          <a className="tag weekday">Weekday Meal</a>
                        </Link>
                      </li>
                    )}
                  </ul>
                </div>
              ))} */}

            {/* {!!seasonTags.length && (
              <div className="col-12 col-md-3">
                <h3>Season</h3>
                <ul>
                  {seasonTags.map(({ season_tag: item }) => (
                    <li key={item._meta.id}>
                      <Link href={`/recipes/seasons/${item._meta.uid}`}>
                        <a className="tag season">{item.season_tag}</a>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )} */}
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

  return {
    props: {
      recipe: recipe.data,
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
