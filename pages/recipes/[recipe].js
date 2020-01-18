import React, { Component } from 'react';
import getCookies from 'next-cookies';
import { RichText } from 'prismic-reactjs';
import { fetchDocumentByUID } from '../../utils/prismic';
import '../../styles/pages/recipe-detail.scss';

class RecipeDetail extends Component {
  static async getInitialProps(context) {
    const { req, res, query } = context;
    const nextCookies = getCookies(context);
    const ref = nextCookies['io.prismic.preview'] || null;

    const id = query.recipe;
    const recipe = await fetchDocumentByUID({ type: 'recipe', id, req });

    if (res)
      res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    return { recipe: recipe.results[0] || {} };
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
        return RichText.render(primary.ingredient);
      case 'instruction_heading':
        return RichText.render(primary.instruction_heading);
      case 'recipe_instruction':
        return RichText.render(primary.instruction);
      default:
        return null;
    }
  };

  render() {
    const { recipe } = this.props;

    if (!recipe.data) return <div>No Recipe Data Found</div>;

    const {
      title,
      source,
      servings,
      cost,
      minutes_prep: prepTime,
      minutes_total: totalTime,
      recipe_photo: photo,
      recipe_notes: notes,
      ingredient_slices: ingredients,
      body: instructions,
      related_recipes: relatedRecipes,
      main_ingredient_tags: ingredientTags,
      cuisine_tags: cuisineTags,
      type_tags: typeTags,
      season_tags: seasonTags,
      weekday_tag: weekdayTag
    } = recipe.data;

    // console.log({
    //   ingredientTags,
    //   cuisineTags,
    //   typeTags,
    //   seasonTags,
    //   weekdayTag
    // });

    return (
      <div id="recipe-detail" className="container">
        <div className="row about">
          <div className="col-12">
            <h1>{RichText.asText(title)}</h1>
            {source && RichText.render(source)}
            {servings && <p>Servings: {servings}</p>}
            {cost && <p>Estimated Cost: ${cost}</p>}
            {prepTime && <p>Prep: {this.formatTime(prepTime)}</p>}
            {totalTime && (
              <p>
                <b>Total Time</b>: {this.formatTime(totalTime)}
              </p>
            )}
            {photo && photo.url && <p>Photo: {photo.url}</p>}
          </div>
        </div>

        {notes && RichText.asText(notes) && (
          <div className="row notes">
            <div className="col-12">
              <h2>Notes:</h2>
              {RichText.render(notes)}
            </div>
          </div>
        )}

        {ingredients && (
          <div className="row ingredients">
            <div className="col-12">
              <h2>Ingredients</h2>
              {React.Children.toArray(
                ingredients.map(ingredient => this.renderTextSlice(ingredient))
              )}
            </div>
          </div>
        )}

        {instructions && (
          <div className="row instructions">
            <div className="col-12">
              <h2>Instructions</h2>
              {React.Children.toArray(
                instructions.map(instruction =>
                  this.renderTextSlice(instruction)
                )
              )}
            </div>
          </div>
        )}

        {relatedRecipes && (
          <div className="row related">
            <div className="col-12">
              <h2>Related Recipes</h2>
            </div>
          </div>
        )}

        <div className="row tags">
          <div className="col-12">
            <h2>Tags</h2>
          </div>
          {ingredientTags && (
            <div className="col-12 col-md-4">
              <h3>Ingredients</h3>
            </div>
          )}
          {cuisineTags && (
            <div className="col-12 col-md-4">
              <h3>Cuisine</h3>
            </div>
          )}
          {typeTags && (
            <div className="col-12 col-md-4">
              <h3>Dish Type</h3>
            </div>
          )}
          {seasonTags && (
            <div className="col-12 col-md-4">
              <h3>Season</h3>
            </div>
          )}
          {weekdayTag && weekdayTag === 'Yes' && (
            <div className="col-12 col-md-4">
              <h3>Weekday</h3>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default RecipeDetail;
