/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */
import React from 'react';
import Link from 'next/link';
import { RichText } from 'prismic-reactjs';
import { getHomepageRecipeLists, fetchDocumentsByType } from '../lib/api';
import '../styles/pages/homepage.scss';

export default function Index({
  nextRecipesList,
  favoriteRecipesList,
  recentlyAdded,
  recipeIdeas
}) {
  const { next_recipes: nextRecipes = [] } = nextRecipesList;
  const { favorite_recipes: favoriteRecipes = [] } = favoriteRecipesList;

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
          {nextRecipes.length ? (
            <div className="card-container d-md-flex">
              {nextRecipes.map(item => {
                const { next_recipe: recipe } = item;
                return (
                  <Link
                    key={recipe._meta.id}
                    href="/recipes/[recipe]"
                    as={`/recipes/${recipe._meta.uid}`}
                  >
                    <a className="card">{RichText.asText(recipe.title)}</a>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p>No recipes selected.</p>
          )}
        </div>
      </div>
      <div className="row mt-md-3">
        <div className="col-12 col-md-6">
          <h3>Ideas for Next Week</h3>
          {recipeIdeas.length ? (
            <ul>
              {recipeIdeas.map((recipe, index) =>
                index < recipeIdeasLimit ? (
                  <li key={recipe.id}>
                    <Link
                      href="/recipes/[recipe]"
                      as={`/recipes/${recipe.uid}`}
                    >
                      <a>{RichText.asText(recipe.data.title)}</a>
                    </Link>
                  </li>
                ) : null
              )}
            </ul>
          ) : (
            <p>No recipes available.</p>
          )}
        </div>
        <div className="col-12 col-md-6">
          <h3>Recently Added Recipes</h3>
          {recentlyAdded.length ? (
            <ul>
              {recentlyAdded.map(recipe => (
                <li key={recipe.id}>
                  <Link href="/recipes/[recipe]" as={`/recipes/${recipe.uid}`}>
                    <a>{RichText.asText(recipe.data.title)}</a>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>No recipes available.</p>
          )}
        </div>
        <div className="col-12 col-md-6">
          <h3>Favorite Recipes</h3>
          {favoriteRecipes.length ? (
            <ul>
              {favoriteRecipes.map(item => {
                const { favorite_recipe: recipe } = item;
                return (
                  <li key={recipe._meta.id}>
                    <Link
                      href="/recipes/[recipe]"
                      as={`/recipes/${recipe._meta.uid}`}
                    >
                      <a className="card">{RichText.asText(recipe.title)}</a>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>No favorite recipes selected.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export async function getStaticProps() {
  const {
    allCook_next_lists,
    allFavorites_lists
  } = await getHomepageRecipeLists();

  const nextRecipesList = allCook_next_lists?.edges[0]?.node;
  const favoriteRecipesList = allFavorites_lists?.edges[0]?.node;

  const [recentlyAdded, recipesByDate] = await Promise.all([
    fetchDocumentsByType({
      type: 'recipe',
      options: {
        orderings: '[document.first_publication_date desc]',
        pageSize: 10
      }
    }),
    fetchDocumentsByType({
      type: 'recipe',
      options: {
        fetchLinks: '[my.recipe.last_cooked_date]',
        pageSize: 100,
        orderings: '[my.recipe.last_cooked_date]'
      }
    })
  ]);

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
        options: {
          fetchLinks: '[my.recipe.last_cooked_date]',
          pageSize: 50,
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

  return {
    props: {
      nextRecipesList,
      favoriteRecipesList,
      recentlyAdded: recentlyAdded.results || [],
      recipeIdeas
    }
  };
}
