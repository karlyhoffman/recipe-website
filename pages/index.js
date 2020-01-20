import React, { Component } from 'react';
import getCookies from 'next-cookies';
import Link from 'next/link';
import { RichText } from 'prismic-reactjs';
import {
  fetchDocumentsByType,
  fetchDocumentsByIDs,
  linkResolver
} from '../utils/prismic';
import '../styles/pages/homepage.scss';

class Homepage extends Component {
  static async getInitialProps(context) {
    const { req, res } = context;
    const nextCookies = getCookies(context);
    const ref = nextCookies['io.prismic.preview'] || null;

    const [recipes, nextRecipes, favoritesList] = await Promise.all([
      fetchDocumentsByType({
        type: 'recipe',
        req,
        options: { orderings: '[my.recipe.title]', pageSize: 25 }
      }),
      fetchDocumentsByType({ type: 'cook_next_list', req })
    ]);

    const cookNextList = [];
    if (nextRecipes && nextRecipes.results && nextRecipes.results[0].data) {
      const IDsToFetch = [];
      // Find already fetched recipe data
      const { next_recipes: nextRecipeList } = nextRecipes.results[0].data;
      nextRecipeList
        .map(recipe => recipe.next_recipe.id)
        .forEach(recipeID => {
          const recipeData = recipes.results.find(
            recipe => recipe.id === recipeID
          );
          return recipeData
            ? cookNextList.push(recipeData)
            : IDsToFetch.push(recipeID);
        });

      if (IDsToFetch.length) {
        const recipeData = await fetchDocumentsByIDs({ ids: IDsToFetch, req });
        if (recipeData.results) cookNextList.push(...recipeData.results);
      }
    }

    const favoriteRecipes = [];

    if (res)
      res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    return {
      recipes: recipes.results || [],
      cookNextList,
      favoriteRecipes
    };
  }

  render() {
    const { recipes, cookNextList, favoritesList } = this.props;

    return (
      <div id="homepage" className="container">
        <div className="row">
          <div className="col-12">
            <h1>5047 Cooking</h1>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <h2>Recipes</h2>
          </div>
          <div className="col-12 col-md-4">
            <h3>Cook Next</h3>
            {cookNextList && (
              <ul>
                {React.Children.toArray(
                  cookNextList.map(recipe => (
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
          <div className="col-12 col-md-4">
            <h3>Recipe Ideas</h3>
            <p>Coming Soon</p>
          </div>
          <div className="col-12 col-md-4">
            <h3>Favorite Recipes</h3>
            <p>Coming Soon</p>
          </div>
        </div>

        <div className="row">
          <div className="col-12">
            <h2>View All</h2>
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

export default Homepage;
