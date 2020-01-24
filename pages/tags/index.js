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
            <ul>
              <li>
                <Link href="/tags/ingredients">
                  <a>Ingredients</a>
                </Link>
              </li>
              <li>
                <Link href="/tags/cuisines">
                  <a>Cuisines</a>
                </Link>
              </li>
              <li>
                <Link href="/tags/dish-types">
                  <a>Dish Types</a>
                </Link>
              </li>
              <li>
                <Link href="/tags/seasons">
                  <a>Seasons</a>
                </Link>
              </li>
              <li>
                <Link href="/tags/weekday">
                  <a>Weekday Meals</a>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

export default TagsOverview;
