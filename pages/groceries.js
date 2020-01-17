import React, { Component } from 'react';
import getCookies from 'next-cookies';
import { RichText } from 'prismic-reactjs';
import { fetchDocumentsByType } from '../utils/prismic';
import '../styles/pages/groceries.scss';

class Groceries extends Component {
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
      <div id="groceries">
        <h1>Grocery List</h1>
        {/* TODO:
            - Ability to select multiple recipes
            - Once a recipe is selected, add ingredients to list
            - Add "edit" button: ability to rearrange or remove ingredients from list
          */}

        <ul>
          <li>Ingredient to buy</li>
        </ul>
      </div>
    );
  }
}

export default Groceries;
