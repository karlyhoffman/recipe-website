import React, { Component } from 'react';
import getCookies from 'next-cookies';
import Link from 'next/link';
import { RichText } from 'prismic-reactjs';
import { fetchDocumentsByType, linkResolver } from '../utils/prismic';
import '../styles/pages/homepage.scss';

class Homepage extends Component {
  static async getInitialProps(context) {
    const { req, res } = context;
    const nextCookies = getCookies(context);
    const ref = nextCookies['io.prismic.preview'] || null;

    const recipes = await fetchDocumentsByType({
      type: 'recipe',
      req,
      options: { orderings: '[my.recipe.title]' }
    });

    if (res)
      res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    return { recipes: recipes.results || [] };
  }

  render() {
    const { recipes } = this.props;

    return (
      <div id="homepage" className="container">
        <div className="row">
          <div className="col-12">
            <h1>5047 Cooking</h1>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <h2>All Recipes</h2>
            {recipes && (
              <ul>
                {React.Children.toArray(
                  recipes.map(recipe => (
                    <li>
                      <Link href={linkResolver(recipe)}>
                        <a>{RichText.asText(recipe.data.title)}</a>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <h2>Recipe Lists</h2>
          </div>
          <div className="col-12 col-md-4">
            <h3>Favorite Recipes</h3>
            <p>Coming Soon</p>
          </div>
          <div className="col-12 col-md-4">
            <h3>Up Next</h3>
            <p>Coming Soon</p>
          </div>
          <div className="col-12 col-md-4">
            <h3>It&apos;s Been a While</h3>
            <p>Coming Soon</p>
          </div>
        </div>
      </div>
    );
  }
}

export default Homepage;
