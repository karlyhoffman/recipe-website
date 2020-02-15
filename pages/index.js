import React, { Component, Children } from 'react';
import getCookies from 'next-cookies';
import Link from 'next/link';
import { RichText } from 'prismic-reactjs';
import {
  fetchDocumentsByType,
  fetchDocumentsByIDs,
  linkResolver
} from '../utils/prismic';
import styles from '../styles/pages/homepage.scss';

class Homepage extends Component {
  static async getInitialProps(context) {
    const { req, res } = context;
    const nextCookies = getCookies(context);
    const ref = nextCookies['io.prismic.preview'] || null;

    const [
      nextRecipesList,
      favoriteRecipesList,
      recentlyAdded,
      recipesByDate
    ] = await Promise.all([
      fetchDocumentsByType({ type: 'cook_next_list', req }),
      fetchDocumentsByType({ type: 'favorites_list', req }),
      fetchDocumentsByType({
        type: 'recipe',
        req,
        options: {
          orderings: '[document.first_publication_date desc]',
          pageSize: 10
        }
      }),
      fetchDocumentsByType({
        type: 'recipe',
        req,
        options: {
          fetchLinks: '[my.recipe.last_cooked_date]',
          pageSize: 25,
          orderings: '[my.recipe.last_cooked_date]'
        }
      })
    ]);

    const cookNextList = [];
    if (
      nextRecipesList &&
      nextRecipesList.results &&
      nextRecipesList.results[0].data
    ) {
      const { next_recipes: nextRecipes } = nextRecipesList.results[0].data;
      const IDsToFetch = nextRecipes
        .map(recipe => recipe.next_recipe.id)
        .filter(recipe => recipe);

      if (IDsToFetch.length) {
        const recipeData = await fetchDocumentsByIDs({
          ids: IDsToFetch,
          req,
          options: { pageSize: 30 }
        });
        if (recipeData.results) cookNextList.push(...recipeData.results);
      }
    }

    const favoritesList = [];
    if (
      favoriteRecipesList &&
      favoriteRecipesList.results &&
      favoriteRecipesList.results[0].data
    ) {
      const {
        favorite_recipes: favoriteRecipes
      } = favoriteRecipesList.results[0].data;
      const IDsToFetch = favoriteRecipes
        .map(recipe => recipe.favorite_recipe.id)
        .filter(recipe => recipe);

      if (IDsToFetch.length) {
        const recipeData = await fetchDocumentsByIDs({
          ids: IDsToFetch,
          req,
          options: { pageSize: 50 }
        });
        if (recipeData.results) favoritesList.push(...recipeData.results);
      }
    }

    const recipeIdeas = [];
    if (recipesByDate && recipesByDate.results) {
      const recipesWithDates = recipesByDate.results.filter(
        recipe => recipe.data.last_cooked_date
      );
      recipeIdeas.push(...recipesWithDates);
      // Fetch more recipes if list is short
      if (recipeIdeas.length < 10) {
        const moreRecipesByDate = await fetchDocumentsByType({
          type: 'recipe',
          req,
          options: {
            fetchLinks: '[my.recipe.last_cooked_date]',
            pageSize: 25,
            after: recipesByDate.results[recipesByDate.results.length - 1].id,
            orderings: '[my.recipe.last_cooked_date]'
          }
        });
        const moreRecipes = moreRecipesByDate.results.filter(
          recipe => recipe.data.last_cooked_date
        );
        recipeIdeas.push(...moreRecipes);
      }
    }

    if (res)
      res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    return {
      cookNextList,
      favoritesList,
      recentlyAdded: recentlyAdded.results || [],
      recipeIdeas
    };
  }

  render() {
    const {
      cookNextList,
      favoritesList,
      recentlyAdded,
      recipeIdeas
    } = this.props;
    const recipeIdeasLimit = 10;

    return (
      <div id="homepage" className="container">
        <div className="row">
          <div className="col-12">
            <h1>5047 Cooking</h1>
          </div>
        </div>
        <div className="row">
          <div className="col-12">
            <h3>Recipes of the Week</h3>
            {cookNextList && cookNextList.length ? (
              <div className="card-container d-md-flex">
                {Children.toArray(
                  cookNextList.map(recipe => (
                    <Link {...linkResolver(recipe)}>
                      <a className="card">
                        {RichText.asText(recipe.data.title)}
                      </a>
                    </Link>
                  ))
                )}
              </div>
            ) : (
              <p>No recipes selected.</p>
            )}
          </div>
        </div>
        <div className="row mt-md-3">
          <div className="col-12 col-md-6">
            <h3>Ideas for Next Week</h3>
            {recipeIdeas ? (
              <ul>
                {Children.toArray(
                  recipeIdeas.map((recipe, index) =>
                    index < recipeIdeasLimit ? (
                      <li>
                        <Link {...linkResolver(recipe)}>
                          <a>{RichText.asText(recipe.data.title)}</a>
                        </Link>
                      </li>
                    ) : null
                  )
                )}
              </ul>
            ) : (
              <p>No recipes available.</p>
            )}
          </div>
          <div className="col-12 col-md-6">
            <h3>Recently Added Recipes</h3>
            {recentlyAdded ? (
              <ul>
                {Children.toArray(
                  recentlyAdded.map(recipe => (
                    <li>
                      <Link {...linkResolver(recipe)}>
                        <a>{RichText.asText(recipe.data.title)}</a>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            ) : (
              <p>No recipes available.</p>
            )}
          </div>
          <div className="col-12">
            <h3>Favorite Recipes</h3>
            {favoritesList ? (
              <ul>
                {Children.toArray(
                  favoritesList.map(recipe => (
                    <li>
                      <Link {...linkResolver(recipe)}>
                        <a>{RichText.asText(recipe.data.title)}</a>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            ) : (
              <p>No favorite recipes selected.</p>
            )}
          </div>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }
}

export default Homepage;
