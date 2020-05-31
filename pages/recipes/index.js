import React, { Component } from 'react';
import getCookies from 'next-cookies';
import Link from 'next/link';
import { RichText } from 'prismic-reactjs';
import PaginationCount from '../../components/PaginationCount';
import { fetchDocumentsByType, linkResolver } from '../../utils/prismic';
import '../../styles/pages/recipes-overview.scss';

const QUERY_SIZE = 100;

class RecipesOverview extends Component {
  static async getInitialProps(context) {
    const { req, res, query } = context;
    const nextCookies = getCookies(context);
    const ref = nextCookies['io.prismic.preview'] || null;
    const page = query.page || 1;

    const recipes = await fetchDocumentsByType({
      type: 'recipe',
      req,
      options: { orderings: '[my.recipe.title]', pageSize: QUERY_SIZE, page }
    });

    if (res)
      res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    return {
      recipes: recipes.results || [],
      recipesCount: recipes.total_results_size || 0,
      page
    };
  }

  render() {
    const { recipes, recipesCount, page } = this.props;

    return (
      <div id="recipes-overview" className="container">
        <div className="row">
          <div className="col-12">
            <h1>Recipes</h1>
          </div>
          <div className="col-12">
            <h2>Tag Categories</h2>
            <ul>
              <li>
                <Link href="/recipes/ingredients">
                  <a>Ingredients</a>
                </Link>
              </li>
              <li>
                <Link href="/recipes/cuisines">
                  <a>Cuisines</a>
                </Link>
              </li>
              <li>
                <Link href="/recipes/dish-types">
                  <a>Dish Types</a>
                </Link>
              </li>
              <li>
                <Link href="/recipes/seasons">
                  <a>Seasons</a>
                </Link>
              </li>
              <li>
                <Link href="/recipes/weekday">
                  <a>Weekday Meals</a>
                </Link>
              </li>
            </ul>
          </div>
          <div className="col-12">
            <h2>All Recipes</h2>
            {recipes.length ? (
              <ul className="recipe-list">
                {recipes.map(recipe => (
                  <li key={recipe.id}>
                    <Link {...linkResolver(recipe)}>
                      <a>{RichText.asText(recipe.data.title)}</a>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recipes found.</p>
            )}

            {recipes.length && (
              <PaginationCount
                querySize={QUERY_SIZE}
                total={recipesCount}
                currentPage={page}
              />
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default RecipesOverview;
