import React, { Component } from 'react';
import getCookies from 'next-cookies';
import { fetchDocumentsByType } from '../../../utils/prismic';
import TagOverviewLayout from '../../../components/TagOverviewLayout';

class CuisineOverview extends Component {
  static async getInitialProps(context) {
    const { req, res } = context;
    const nextCookies = getCookies(context);
    const ref = nextCookies['io.prismic.preview'] || null;

    const cuisineTags = await fetchDocumentsByType({
      type: 'cuisine_tag',
      req,
      options: { orderings: '[my.cuisine_tag.cuisine_tag]', pageSize: 100 }
    });

    if (res)
      res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    return {
      cuisineTags: cuisineTags.results || []
    };
  }

  render() {
    const { cuisineTags } = this.props;

    return (
      <TagOverviewLayout
        tags={cuisineTags}
        label="Cuisine Tags"
        titleKey="cuisine_tag"
      />
    );
  }
}

export default CuisineOverview;
