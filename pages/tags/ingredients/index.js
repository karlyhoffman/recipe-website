import React, { Component } from 'react';
import getCookies from 'next-cookies';
import { fetchDocumentsByType } from '../../../utils/prismic';

class IngredientTagsOverview extends Component {
  static async getInitialProps(context) {
    const { req, res } = context;
    const nextCookies = getCookies(context);
    const ref = nextCookies['io.prismic.preview'] || null;

    const ingredientTags = await fetchDocumentsByType({
      type: 'ingredient_tag',
      req
    });

    if (res)
      res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    return {
      ingredientTags: ingredientTags.results || []
    };
  }

  render() {
    const { ingredientTags } = this.props;

    return (
      <div id="tags-overview">
        <h1>View Dish Type Tags</h1>
      </div>
    );
  }
}

export default IngredientTagsOverview;
