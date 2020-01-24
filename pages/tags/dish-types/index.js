import React, { Component } from 'react';
import getCookies from 'next-cookies';
import { fetchDocumentsByType } from '../../../utils/prismic';
import TagOverviewLayout from '../../../components/TagOverviewLayout';

class DishTypeOverview extends Component {
  static async getInitialProps(context) {
    const { req, res } = context;
    const nextCookies = getCookies(context);
    const ref = nextCookies['io.prismic.preview'] || null;

    const dishTypeTags = await fetchDocumentsByType({
      type: 'type_tag',
      req,
      options: { orderings: '[my.type_tag.type_tag]', pageSize: 100 }
    });

    if (res)
      res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    return {
      dishTypeTags: dishTypeTags.results || []
    };
  }

  render() {
    const { dishTypeTags } = this.props;

    return (
      <TagOverviewLayout
        tags={dishTypeTags}
        label="Dish Type Tags"
        titleKey="type_tag"
      />
    );
  }
}

export default DishTypeOverview;
