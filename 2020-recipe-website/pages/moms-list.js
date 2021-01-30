/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { RichText } from 'prismic-reactjs';
import { getMomsRecipeList } from '../lib/api';
import GroceryList from '../components/GroceryList';
import '../styles/pages/homepage.scss';
import '../styles/pages/groceries.scss';

const INITIAL_STATE = {
  nextRecipes: [],
  nextIngredients: []
};

export default function Index() {
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [data, setData] = useState(INITIAL_STATE);
  const [isEditing, setIsEditing] = useState(false);

  // fetch data client-side because of paywall
  const fetchData = async () => {
    const { allMoms_lists } = await getMomsRecipeList();

    const momsRecipes = allMoms_lists?.edges[0]?.node;

    const nextIngredients = [];
    if (momsRecipes.next_recipes) {
      const nextRecipeIngredients = momsRecipes.next_recipes
        .map(item => item.next_recipe.ingredient_slices)
        .flat()
        .map(ingredient => ingredient.primary.ingredient);
      nextIngredients.push(...nextRecipeIngredients);
    }

    const fetchedResults = {
      nextRecipes: momsRecipes.next_recipes || [],
      nextIngredients
    };

    setData(fetchedResults);
    setIsLoadingData(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div id="homepage" className="container">
      {!isLoadingData && (
        <>
          <div className="row">
            <div className="col-12">
              <h2 className="mb-4 pb-3">Mom&apos;s Recipe List</h2>
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
          <div id="groceries" className="row mt-4">
            <div className="col-12 d-flex col-title">
              <h2>The Ingredients</h2>
              <button
                className={isEditing ? 'edit-btn editing' : 'edit-btn'}
                onClick={() => setIsEditing(!isEditing)}
                type="button"
              >
                {!isEditing ? 'Edit' : 'Done'}
              </button>
            </div>
            <div className="col-12" style={{ marginTop: -30 }}>
              {data.nextIngredients && (
                <GroceryList
                  ingredients={data.nextIngredients}
                  {...{ isEditing }}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
