import React, { Component } from 'react';
import getCookies from 'next-cookies';
import { fetchDocumentsByType } from '../../../utils/prismic';

class DishTypeOverview extends Component {
  static async getInitialProps(context) {
    const { req, res } = context;
    const nextCookies = getCookies(context);
    const ref = nextCookies['io.prismic.preview'] || null;

    const dishTypeTags = await fetchDocumentsByType({ type: 'type_tag', req });

    if (res)
      res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    return {
      dishTypeTags: dishTypeTags.results || []
    };
  }

  render() {
    const { dishTypeTags } = this.props;

    return (
      <div id="tags-overview">
        <h1>View Dish Type Tags</h1>
      </div>
    );
  }
}

export default DishTypeOverview;
