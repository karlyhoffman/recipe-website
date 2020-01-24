import React, { Component } from 'react';
import getCookies from 'next-cookies';
import Link from 'next/link';
import '../../styles/pages/tags-overview.scss';

class TagsOverview extends Component {
  static async getInitialProps(context) {
    const { req, res } = context;
    const nextCookies = getCookies(context);
    const ref = nextCookies['io.prismic.preview'] || null;

    if (res)
      res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    return {};
  }

  render() {
    return (
      <div id="tags-overview" className="container">
        <div className="row">
          <div className="col-12">
            <h1>Tag Categories</h1>
          </div>
          <div className="col-6 col-md-4">
            <Link href="/tags/ingredients">
              <a>Ingredients</a>
            </Link>
          </div>
          <div className="col-6 col-md-4">
            <Link href="/tags/cuisines">
              <a>Cuisines</a>
            </Link>
          </div>
          <div className="col-6 col-md-4">
            <Link href="/tags/dish-types">
              <a>Dish Types</a>
            </Link>
          </div>
          <div className="col-6 col-md-4">
            <Link href="/tags/seasons">
              <a>Seasons</a>
            </Link>
          </div>
          <div className="col-6 col-md-4">
            <Link href="/tags/weekday">
              <a>Weekday Meals</a>
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

export default TagsOverview;
