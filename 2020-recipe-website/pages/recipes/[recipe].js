/* eslint-disable no-underscore-dangle */
import React, { useState, useEffect } from 'react';
import ErrorPage from 'next/error';
import Link from 'next/link';
import { RichText } from 'prismic-reactjs';
import { getRecipe, linkResolver } from '../../lib/api';
import { htmlSerializer } from '../../lib/htmlSerializer';

import '../../styles/pages/recipe-detail.scss';

export default function RecipeDetail() {
  const [recipe, setRecipe] = useState();
  const [isLoadingData, setIsLoadingData] = useState(true);

  // fetch data client-side because of paywall
  const fetchData = async () => {
    const { pathname } = window.location;
    const query = pathname.replace('/recipes/', '');

    const data = await getRecipe(query);
    setRecipe(data.recipe);
    setIsLoadingData(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!recipe && !isLoadingData) return <ErrorPage statusCode={404} />;
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
        return RichText.render(
          primary.ingredient,
          linkResolver,
          htmlSerializer
        );
      case 'instruction_heading':
        return RichText.render(primary.instruction_heading);
      case 'recipe_instruction':
        return RichText.render(
          primary.instruction,
          linkResolver,
          htmlSerializer
        );
      default:
        return null;
    }
  };

  return (
    <div id="recipe-detail" className="container-fluid px-0">
      {hasHeroImg && (
        <div
          className="hero-img"
          style={{ backgroundImage: `url(${photo.url})` }}
        />
      )}

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
            {source && source.length && (
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
          <div className="row steps">
            <div className="col-12 col-md-4 ingredients">
              <h2 className="heading">Ingredients</h2>
              <div className="ingredient-menu">
                {ingredients &&
                  React.Children.toArray(
                    ingredients.map(ingredient => renderTextSlice(ingredient))
                  )}
              </div>
            </div>
            <div className="col-12 col-md-8 instructions">
              <div>
                <h2 className="heading">Instructions</h2>
                {instructions &&
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
                        <a
                          className="card"
                          href={`/recipes/${related._meta.uid}`}
                        >
                          {RichText.asText(related.title)}
                        </a>
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
