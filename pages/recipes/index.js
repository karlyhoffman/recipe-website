import React, { Component } from 'react';
import getCookies from 'next-cookies';
import { RichText } from 'prismic-reactjs';
import { fetchDocumentsByType } from '../../utils/prismic';
import styles from '../../styles/homepage.scss';

class RecipesOverview extends Component {
  static async getInitialProps(context) {
    const { req, res } = context;
    const nextCookies = getCookies(context);
    const ref = nextCookies['io.prismic.preview'] || null;

    const recipes = await fetchDocumentsByType({ type: 'recipe', req });

    if (res)
      res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    return { recipes: recipes.results || [] };
  }

  render() {
    const { recipes } = this.props;

    return (
      <div id="recipes-overview">
        <h1>View All Recipes</h1>
        {recipes && (
          <ul>
            {React.Children.toArray(
              recipes.map(recipe => (
                <li>{RichText.asText(recipe.data.title)}</li>
              ))
            )}
          </ul>
        )}

        <style jsx>{styles}</style>
      </div>
    );
  }
}

export default RecipesOverview;