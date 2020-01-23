import React, { Component } from 'react';
import getCookies from 'next-cookies';
import { Prismic, Client, fetchDocumentByUID } from '../../../utils/prismic';

class TagDetail extends Component {
  static async getInitialProps(context) {
    const { req, res, query } = context;
    const nextCookies = getCookies(context);
    const ref = nextCookies['io.prismic.preview'] || null;

    // Get document by UID
    const cuisineTag = await fetchDocumentByUID({
      type: 'cuisine_tag',
      id: query['cuisine-tag'],
      req
    });

    const recipes = await Client(req).query([
      Prismic.Predicates.at('document.type', 'recipe'),
      Prismic.Predicates.at(
        'my.recipe.cuisine_tags.cuisine_tag',
        'XhowaBEAACUANSlP' // cuisineTag.id
      )
    ]);

    if (res)
      res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    return {
      recipes: recipes.results || []
    };
  }

  render() {
    const { recipes } = this.props;

    return (
      <div id="tag-detail">
        <h1>View Recipes By Tag</h1>
      </div>
    );
  }
}

export default TagDetail;
