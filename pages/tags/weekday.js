import React, { Component } from 'react';
import getCookies from 'next-cookies';
import { Prismic, Client } from '../../utils/prismic';
import TagOverviewLayout from '../../components/TagOverviewLayout';

class WeekdayTagDetail extends Component {
  static async getInitialProps(context) {
    const { req, res } = context;
    const nextCookies = getCookies(context);
    const ref = nextCookies['io.prismic.preview'] || null;

    const weekdayRecipes = await Client(req).query(
      Prismic.Predicates.at('my.recipe.weekday_tag', 'Yes'),
      { orderings: '[my.recipe.title]', pageSize: 100 }
    );

    if (res)
      res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    return {
      weekdayRecipes: weekdayRecipes.results || []
    };
  }

  render() {
    const { weekdayRecipes } = this.props;

    return <TagOverviewLayout tags={weekdayRecipes} label="Weekday Meals" />;
  }
}

export default WeekdayTagDetail;
