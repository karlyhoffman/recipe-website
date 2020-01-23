import React, { Component } from 'react';
import getCookies from 'next-cookies';
import { Prismic, Client } from '../../utils/prismic';

class WeekdayTagDetail extends Component {
  static async getInitialProps(context) {
    const { req, res } = context;
    const nextCookies = getCookies(context);
    const ref = nextCookies['io.prismic.preview'] || null;

    const weekdayTags = await Client(req).query(
      Prismic.Predicates.at('my.recipe.weekday_tag', 'Yes')
    );

    if (res)
      res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    return {
      weekdayTags: weekdayTags.results || []
    };
  }

  render() {
    const { weekdayTags } = this.props;

    return (
      <div id="tags-overview">
        <h1>View Dish Type Tags</h1>
      </div>
    );
  }
}

export default WeekdayTagDetail;
