/* eslint-disable no-underscore-dangle */
import React, { useRef } from 'react';
import { useRouter } from 'next/router';
import ErrorPage from 'next/error';
import Link from 'next/link';
import { RichText } from 'prismic-reactjs';
import { getAllRecipesWithSlug, getRecipe, linkResolver } from '../../lib/api';
import IngredientMenu from '../../components/IngredientMenu';

import '../../styles/pages/recipe-detail.scss';

export default function RecipeDetail({ recipe }) {
  const router = useRouter();
  if (!router.isFallback && !recipe?._meta?.uid) {
    return <ErrorPage statusCode={404} />;
  }

  const stickyContainer = useRef();
  const instructionsColumn = useRef();

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

  const renderTextSlice = ({ type, primary }) => {
    switch (type) {
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
    <div id="recipe-detail" className="container-fluid px-0">
      <div className="hero-img">
        {hasHeroImg && <img src={photo.url} alt="" />}
      </div>

      <div
        className={`body container-fluid ${hasHeroImg ? 'has-hero-img' : ''}`}
      >
        <div className="container">
          <div className="row">
            <div className="col-12">
              <h1>{RichText.asText(title)}</h1>
            </div>
          </div>
          <div className="row about">
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
              <div className="col-12 notes">
                <strong>Notes:</strong>
                {RichText.render(notes)}
              </div>
            )}
            {source && !!source.length && (
              <div className="col-12 source">
                <p className="label">Source:</p>
                {RichText.render(source)}
              </div>
            )}
            <div className="col-12">
              <div className="line" />
            </div>
          </div>
        </div>

        <div className="container">
          <div className="row steps" ref={stickyContainer}>
            <div className="col-12 col-md-4 ingredients">
              <IngredientMenu
                parentContainer={stickyContainer}
                sibling={instructionsColumn}
              >
                <h2 className="heading">Ingredients</h2>
                {ingredients.length &&
                  React.Children.toArray(
                    ingredients.map(ingredient => renderTextSlice(ingredient))
                  )}
              </IngredientMenu>
            </div>
            <div className="col-12 col-md-8 instructions">
              <div ref={instructionsColumn}>
                <h2 className="heading">Instructions</h2>
                {instructions.length &&
                  React.Children.toArray(
                    instructions.map(instruction =>
                      renderTextSlice(instruction)
                    )
                  )}
              </div>
            </div>
            <div className="col-12">
              <div className="line" />
            </div>
          </div>

          {!!relatedRecipes.length && relatedRecipes[0].related_recipe && (
            <div className="row related">
              <div className="col-12">
                <h2>Related Recipes</h2>
                <ul>
                  {relatedRecipes.map(item => {
                    const { related_recipe: related } = item;
                    if (!related) return null;
                    return (
                      <li key={related._meta.id}>
                        <Link
                          href="/recipes/[recipe]"
                          as={`/recipes/${related._meta.uid}`}
                        >
                          <a className="card">
                            {RichText.asText(related.title)}
                          </a>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div className="col-12">
                <div className="line" />
              </div>
            </div>
          )}

          <div className="row tags">
            <div className="col-12">
              <h2>Tags</h2>
            </div>
            {!!ingredientTags.length && ingredientTags[0].ingredient_tag && (
              <div className="col-12 col-md-3">
                <h3>Ingredients</h3>
                <ul>
                  {ingredientTags.map(tag => {
                    const { ingredient_tag: item } = tag;
                    return (
                      <li key={item._meta.id}>
                        <Link
                          href="/recipes/ingredients/[ingredient-tag]"
                          as={`/recipes/ingredients/${item._meta.uid}`}
                        >
                          <a className="tag ingredient">
                            {item.ingredient_tag}
                          </a>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {!!cuisineTags.length && cuisineTags[0].cuisine_tag && (
              <div className="col-12 col-md-3">
                <h3>Cuisine</h3>
                <ul>
                  {cuisineTags.map(tag => {
                    const { cuisine_tag: item } = tag;
                    return (
                      <li key={item._meta.id}>
                        <Link
                          href="/recipes/cuisines/[cuisine-tag]"
                          as={`/recipes/cuisines/${item._meta.uid}`}
                        >
                          <a className="tag cuisine">{item.cuisine_tag}</a>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {weekdayTag === 'Yes' ||
              (!!typeTags.length && typeTags[0].type_tag && (
                <div className="col-12 col-md-3">
                  <h3>Dish Type</h3>
                  <ul>
                    {typeTags.map(tag => {
                      const { type_tag: item } = tag;
                      return (
                        <li key={item._meta.id}>
                          <Link
                            href="/recipes/dish-types/[dish-type]"
                            as={`/recipes/dish-types/${item._meta.uid}`}
                          >
                            <a className="tag type">{item.type_tag}</a>
                          </Link>
                        </li>
                      );
                    })}
                    {weekdayTag === 'Yes' && (
                      <li>
                        <Link href="/recipes/weekday">
                          <a className="tag weekday">Weekday Meal</a>
                        </Link>
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            {!!seasonTags.length && seasonTags[0].season_tag && (
              <div className="col-12 col-md-3">
                <h3>Season</h3>
                <ul>
                  {seasonTags.map(tag => {
                    const { season_tag: item } = tag;
                    return (
                      <li key={item._meta.id}>
                        <Link
                          href="/recipes/seasons/[season]"
                          as={`/recipes/seasons/${item._meta.uid}`}
                        >
                          <a className="tag season">{item.season_tag}</a>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getStaticProps({ params, preview = false, previewData }) {
  const data = await getRecipe(params.recipe, previewData);
  return {
    props: {
      preview,
      recipe: data?.recipe ?? null
    }
  };
}

export async function getStaticPaths() {
  const allRecipes = await getAllRecipesWithSlug();
  return {
    paths: allRecipes?.map(({ node }) => `/recipes/${node._meta.uid}`) || [],
    fallback: true
  };
}
