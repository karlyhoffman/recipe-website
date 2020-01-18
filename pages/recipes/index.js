import React, { Component } from 'react';
import getCookies from 'next-cookies';
import Link from 'next/link';
import { RichText } from 'prismic-reactjs';
import { fetchDocumentsByType, linkResolver } from '../../utils/prismic';
import '../../styles/pages/homepage.scss';

class RecipesOverview extends Component {
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
      <div id="recipes-overview" className="container">
        <div className="row">
          <div className="col-12">
            <h1>Recipes</h1>

            {/* SEARCH/FILTER TODO:
              - Text Search Bar
              - Tag Filters:
                - tag types
                  - Cuisine
                  - Dish Type
                  - Ingredient
                  - Season
                  - Day (Weekend or Weekday)
                - time
                - cost
            */}

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
      </div>
    );
  }
}

export default RecipesOverview;
