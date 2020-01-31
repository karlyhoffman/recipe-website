import React, { Component, Children } from 'react';
import getCookies from 'next-cookies';
import Link from 'next/link';
import Error from 'next/error';
import { RichText } from 'prismic-reactjs';
import {
  fetchDocumentByUID,
  fetchDocumentsByIDs,
  linkResolver
} from '../../utils/prismic';
import IngredientMenu from '../../components/IngredientMenu';
import '../../styles/pages/recipe-detail.scss';

class RecipeDetail extends Component {
  static async getInitialProps(context) {
    const { req, res, query } = context;
    const nextCookies = getCookies(context);
    const ref = nextCookies['io.prismic.preview'] || null;

    const id = query.recipe;
    const recipe = await fetchDocumentByUID({ type: 'recipe', id, req });

    const relatedRecipes = [];
    const tags = [];
    const results = recipe.results[0] || null;

    if (results && results.data) {
      // Fetch related recipes
      if (
        results.data.related_recipes[0] &&
        results.data.related_recipes[0].related_recipe
      ) {
        const ids = results.data.related_recipes.map(
          el => el.related_recipe.id
        );
        const related = await fetchDocumentsByIDs({ ids, req });
        if (related.results) relatedRecipes.push(...related.results);
      }

      // Fetch tag data
      const tagIDs = [];
      const {
        main_ingredient_tags: ingredientTags,
        cuisine_tags: cuisineTags,
        type_tags: typeTags,
        season_tags: seasonTags
      } = results.data;

      const ingredientIDs = ingredientTags
        .map(el => el.ingredient_tag.id)
        .filter(tagID => tagID);
      if (ingredientIDs.length) tagIDs.push(...ingredientIDs);

      const cuisineIDs = cuisineTags
        .map(el => el.cuisine_tag.id)
        .filter(tagID => tagID);
      if (cuisineIDs.length) tagIDs.push(...cuisineIDs);

      const typeIDs = typeTags.map(el => el.type_tag.id).filter(tagID => tagID);
      if (typeIDs.length) tagIDs.push(...typeIDs);

      const seasonIDs = seasonTags
        .map(el => el.season_tag.id)
        .filter(tagID => tagID);
      if (seasonIDs.length) tagIDs.push(...seasonIDs);

      const tagData = await fetchDocumentsByIDs({ ids: tagIDs, req });
      if (tagData.results) tags.push(...tagData.results);
    }

    if (res)
      res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    return { recipe: results || {}, relatedRecipes, tags };
  }

  constructor(props) {
    super(props);

    this.stickyContainer = React.createRef();
    this.instructionsColumn = React.createRef();
  }

  formatTime = time => {
    const hours = Math.floor(time / 60);
    const minutes = time % 60 < 10 ? `0${time % 60}` : time % 60;
    return `${hours}:${minutes}`;
  };

  renderTextSlice = ({ slice_type: type, primary }) => {
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

  render() {
    const { recipe, relatedRecipes, tags } = this.props;

    if (!recipe.data) return <Error statusCode={404} />;

    const {
      title,
      source,
      servings,
      cost,
      minutes_prep: prepTime,
      minutes_total: totalTime,
      recipe_photo: photo,
      color,
      recipe_notes: notes,
      ingredient_slices: ingredients,
      body: instructions,
      main_ingredient_tags: ingredientTags,
      cuisine_tags: cuisineTags,
      type_tags: typeTags,
      season_tags: seasonTags,
      weekday_tag: weekdayTag
    } = recipe.data;

    const hasHeroImg = photo && photo.url;

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
                <h1 style={{ color: hasHeroImg ? '#333' : color }}>
                  {RichText.asText(title)}
                </h1>
              </div>
            </div>
            <div className="row about">
              <div className="col-12 col-md-6 col-lg-3">
                {prepTime && (
                  <p>
                    <strong>Prep</strong>: {this.formatTime(prepTime)}
                  </p>
                )}
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                {totalTime && (
                  <p>
                    <strong>Total Time</strong>: {this.formatTime(totalTime)}
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
                <div className="col-12 source d-flex">
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
            <div className="row steps" ref={this.stickyContainer}>
              <div className="col-12 col-md-4 ingredients">
                <IngredientMenu
                  parentContainer={this.stickyContainer}
                  sibling={this.instructionsColumn}
                >
                  <h2 className="heading">Ingredients</h2>
                  {ingredients &&
                    Children.toArray(
                      ingredients.map(ingredient =>
                        this.renderTextSlice(ingredient)
                      )
                    )}
                </IngredientMenu>
              </div>
              <div className="col-12 col-md-8 instructions">
                <div ref={this.instructionsColumn}>
                  <h2 className="heading">Instructions</h2>
                  {instructions &&
                    Children.toArray(
                      instructions.map(instruction =>
                        this.renderTextSlice(instruction)
                      )
                    )}
                </div>
              </div>
              <div className="col-12">
                <div className="line" />
              </div>
            </div>

            {relatedRecipes && !!relatedRecipes.length && (
              <div className="row related">
                <div className="col-12">
                  <h2>Related Recipes</h2>
                  <ul>
                    {Children.toArray(
                      relatedRecipes.map(related => (
                        <li>
                          <Link href={linkResolver(related)}>
                            <a>{RichText.asText(related.data.title)}</a>
                          </Link>
                        </li>
                      ))
                    )}
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
              {!!ingredientTags.length && (
                <div className="col-12 col-md-3">
                  <h3>Ingredients</h3>
                  <ul>
                    {Children.toArray(
                      ingredientTags.map(tag => (
                        <li>
                          <Link href={linkResolver(tag.ingredient_tag)}>
                            <a>
                              {tags.find(t => t.id === tag.ingredient_tag.id)
                                .data.ingredient_tag || ''}
                            </a>
                          </Link>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
              {!!cuisineTags.length && (
                <div className="col-12 col-md-3">
                  <h3>Cuisine</h3>
                  <ul>
                    {Children.toArray(
                      cuisineTags.map(tag => (
                        <li>
                          <Link href={linkResolver(tag.cuisine_tag)}>
                            <a>
                              {tags.find(t => t.id === tag.cuisine_tag.id).data
                                .cuisine_tag || ''}
                            </a>
                          </Link>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              )}
              {!!typeTags.length && weekdayTag && weekdayTag === 'Yes' && (
                <div className="col-12 col-md-3">
                  <h3>Dish Type</h3>
                  <ul>
                    {Children.toArray(
                      typeTags.map(tag => (
                        <li>
                          <Link href={linkResolver(tag.type_tag)}>
                            <a>
                              {tags.find(t => t.id === tag.type_tag.id).data
                                .type_tag || ''}
                            </a>
                          </Link>
                        </li>
                      ))
                    )}
                    {weekdayTag && weekdayTag === 'Yes' && (
                      <li>
                        <Link href="/recipes/weekday">
                          <a>Weekday Meal</a>
                        </Link>
                      </li>
                    )}
                  </ul>
                </div>
              )}
              {!!seasonTags.length && (
                <div className="col-12 col-md-3">
                  <h3>Season</h3>
                  <ul>
                    {Children.toArray(
                      seasonTags.map(tag => (
                        <li>
                          <Link href={linkResolver(tag.season_tag)}>
                            <a>
                              {tags.find(t => t.id === tag.season_tag.id).data
                                .season_tag || ''}
                            </a>
                          </Link>
                        </li>
                      ))
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
}

export default RecipeDetail;
