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

  render() {
    const { recipe } = this.props;

    if (!recipe.data) return <div>No Recipe Data Found</div>;

    const {
      title,
      source,
      servings,
      cost,
      prep_time: prepTime,
      total_time: totalTime,
      last_cooked_date: dateLastCooked,
      recipe_photo: photo,
      recipe_notes: notes,
      ingredients,
      body,
      related_recipes: relatedRecipes,
      main_ingredient_tags: ingredientTags,
      cuisine_tags: cuisineTags,
      type_tags: typeTags,
      season_tags: seasonTags,
      time_tags: timeTags,
      day_tags: dayTags
    } = recipe.data;

    return (
      <div id="recipe-detail">
        <h1>{RichText.asText(title)}</h1>

        <style jsx>{styles}</style>
      </div>
    );
  }
}

export default RecipeDetail;
