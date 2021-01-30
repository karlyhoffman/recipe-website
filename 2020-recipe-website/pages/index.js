/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { RichText } from 'prismic-reactjs';
import { getHomepageRecipeLists, fetchDocumentsByType } from '../lib/api';
import '../styles/pages/homepage.scss';

const INITIAL_STATE = {
  nextRecipes: [],
  favoriteRecipes: [],
  recentlyAdded: [],
  recipeIdeas: []
};

export default function Index() {
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [data, setData] = useState(INITIAL_STATE);
  const recipeIdeasLimit = 10;

  // fetch data client-side because of paywall
  const fetchData = async () => {
    const {
      allCook_next_lists,
      allFavorites_lists
    } = await getHomepageRecipeLists();

    const nextRecipesList = allCook_next_lists?.edges[0]?.node;
    const favoriteRecipesList = allFavorites_lists?.edges[0]?.node;

    const [recentlyAddedRecipes, recipesByDate] = await Promise.all([
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

    const recipeIdeasList = [];
    if (recipesByDate && recipesByDate.results) {
      const recipesWithDates = recipesByDate.results.filter(
        recipe => recipe.data.last_cooked_date
      );
      recipeIdeasList.push(...recipesWithDates);
      // Fetch more recipes if list is short
      if (recipeIdeasList.length < 10) {
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
        recipeIdeasList.push(...moreRecipes);
      }
    }

    const fetchedResults = {
      nextRecipes: nextRecipesList.next_recipes || [],
      favoriteRecipes: favoriteRecipesList.favorite_recipes || [],
      recentlyAdded: recentlyAddedRecipes.results || [],
      recipeIdeas: recipeIdeasList
    };

    setData(fetchedResults);
    setIsLoadingData(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const checkIfCocktail = typeTags => {
    if (!typeTags.length) return false;
    const isNotCocktail = typeTags.filter(tag => tag.type_tag.uid !== 'cocktails');
    return !!isNotCocktail.length;
  };

  return (
    <div id="homepage" className="container">
      {!isLoadingData && (
        <>
          <div className="row">
            <div className="col-12">
              <h1>5047 Cooking</h1>
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <h3>Recipes of the Week</h3>
              {data.nextRecipes.length ? (
                <div className="card-container d-md-flex">
                  {data.nextRecipes.map(item => {
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
              {data.recipeIdeas.length ? (
                <ul>
                  {data.recipeIdeas.map((recipe, index) =>
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
              {data.recentlyAdded.length ? (
                <ul>
                  {data.recentlyAdded
                    .filter(recipe => checkIfCocktail(recipe.data.type_tags))
                    .map(recipe => (
                      <li key={recipe.id}>
                        <Link
                          href="/recipes/[recipe]"
                          as={`/recipes/${recipe.uid}`}
                        >
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
              {data.favoriteRecipes.length ? (
                <ul>
                  {data.favoriteRecipes.map(item => {
                    const { favorite_recipe: recipe } = item;
                    return (
                      <li key={recipe._meta.id}>
                        <Link
                          href="/recipes/[recipe]"
                          as={`/recipes/${recipe._meta.uid}`}
                        >
                          <a className="card">
                            {RichText.asText(recipe.title)}
                          </a>
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
        </>
      )}
    </div>
  );
}
