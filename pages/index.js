import React, { Component } from 'react';
import getCookies from 'next-cookies';
import { RichText } from 'prismic-reactjs';
import { fetchDocumentsByType } from '../utils/prismic';
import '../styles/pages/homepage.scss';

class Homepage extends Component {
  static async getInitialProps(context) {
    const { req, res } = context;
    const nextCookies = getCookies(context);
    const ref = nextCookies['io.prismic.preview'] || null;

    const recipes = await fetchDocumentsByType({ type: 'recipe', req });

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
          <div className="col-12 col-md-6">
            <h2>Favorite Recipes</h2>
            <p>Coming Soon</p>
          </div>
          <div className="col-12 col-md-6">
            <h2>Recipes to Cook Next</h2>
            <p>Coming Soon</p>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <h2>Recipes That Haven&apos;t Been Cooked in a While</h2>
            <p>Coming Soon</p>
          </div>
        </div>
      </div>
    );
  }
}

export default Homepage;
