import React, { Component } from 'react';
import getCookies from 'next-cookies';
import { fetchDocumentsByType } from '../../../utils/prismic';
import TagOverviewLayout from '../../../components/TagOverviewLayout';

class SeasonTagsOverview extends Component {
  static async getInitialProps(context) {
    const { req, res } = context;
    const nextCookies = getCookies(context);
    const ref = nextCookies['io.prismic.preview'] || null;

    const seasonTags = await fetchDocumentsByType({
      type: 'season_tag',
      req,
      options: { orderings: '[my.season_tag.season_tag]', pageSize: 100 }
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
      <TagOverviewLayout
        tags={seasonTags}
        label="Season Tags"
        titleKey="season_tag"
      />
    );
  }
}

export default SeasonTagsOverview;
