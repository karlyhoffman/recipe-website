import React, { Component } from 'react';
import getCookies from 'next-cookies';
import { fetchDocumentsByType } from '../../../utils/prismic';

class SeasonTagsOverview extends Component {
  static async getInitialProps(context) {
    const { req, res } = context;
    const nextCookies = getCookies(context);
    const ref = nextCookies['io.prismic.preview'] || null;

    const seasonTags = await fetchDocumentsByType({
      type: 'season_tag',
      req
    });

    if (res)
      res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    return {
      seasonTags: seasonTags.results || []
    };
  }

  render() {
    const { seasonTags } = this.props;

    return (
      <div id="tags-overview">
        <h1>View Dish Type Tags</h1>
      </div>
    );
  }
}

export default SeasonTagsOverview;
