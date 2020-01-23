import React, { Component } from 'react';
import getCookies from 'next-cookies';
import { fetchDocumentsByType } from '../../../utils/prismic';

class CuisineOverview extends Component {
  static async getInitialProps(context) {
    const { req, res } = context;
    const nextCookies = getCookies(context);
    const ref = nextCookies['io.prismic.preview'] || null;

    const cuisineTags = await fetchDocumentsByType({
      type: 'cuisine_tag',
      req
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
      <div id="tags-overview">
        <h1>View Cuisine Tags</h1>
      </div>
    );
  }
}

export default CuisineOverview;
