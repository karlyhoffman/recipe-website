import React, { Component } from 'react';
import getCookies from 'next-cookies';
import { RichText } from 'prismic-reactjs';
import { fetchDocumentByUID } from '../../utils/prismic';
import styles from '../../styles/pages/recipe-detail.scss';

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
      ingredients,
      body: instructions,
      related_recipes: relatedRecipes,
      main_ingredient_tags: ingredientTags,
      cuisine_tags: cuisineTags,
      type_tags: typeTags,
      season_tags: seasonTags,
      time_tags: timeTags,
      day_tags: dayTags
    } = recipe.data;

    return (
      <div id="recipe-detail" className="container">
        <div className="row about">
          <div className="col-12">
            <h1>{RichText.asText(title)}</h1>
            {source && RichText.render(source)}
            {servings && <p>Servings: {servings}</p>}
            {cost && <p>${cost}</p>}
            {prepTime && <p>Prep: {this.formatTime(prepTime)}</p>}
            {totalTime && (
              <p>
                <b>Total Time</b>: {this.formatTime(totalTime)}
              </p>
            )}
            {photo && photo.url && <p>Photo: {photo.url}</p>}
            {!!notes.length && (
              <>
                <p>Notes:</p>
                {RichText.render(notes)}
              </>
            )}
          </div>
        </div>

        <div className="row ingredients">
          <div className="col-12">
            <h2>Ingredients</h2>
            {/* Ingredients Slice */}
          </div>
        </div>

        <div className="row instructions">
          <div className="col-12">
            <h2>Instructions</h2>
            {/* Instructions Slice */}
          </div>
        </div>

        {!!relatedRecipes.length && (
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
        </div>

        <style jsx>{styles}</style>
      </div>
    );
  }
}

export default RecipeDetail;
