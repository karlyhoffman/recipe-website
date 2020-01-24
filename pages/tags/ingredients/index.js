import React, { Component } from 'react';
import getCookies from 'next-cookies';
import { fetchDocumentsByType } from '../../../utils/prismic';
import TagOverviewLayout from '../../../components/TagOverviewLayout';

class IngredientTagsOverview extends Component {
  static async getInitialProps(context) {
    const { req, res } = context;
    const nextCookies = getCookies(context);
    const ref = nextCookies['io.prismic.preview'] || null;

    const ingredientTags = await fetchDocumentsByType({
      type: 'ingredient_tag',
      req,
      options: {
        orderings: '[my.ingredient_tag.ingredient_tag]',
        pageSize: 100
      }
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
      <TagOverviewLayout
        tags={ingredientTags}
        label="Main Ingredient Tags"
        titleKey="ingredient_tag"
      />
    );
  }
}

export default IngredientTagsOverview;
