import React, { Component } from 'react';
import getCookies from 'next-cookies';
import { RichText } from 'prismic-reactjs';
import { fetchDocumentsByType, fetchDocumentsByIDs } from '../utils/prismic';
import GroceryList from '../components/GroceryList';
import styles from '../styles/pages/groceries.scss';

class Groceries extends Component {
  static async getInitialProps(context) {
    const { req, res } = context;
    const nextCookies = getCookies(context);
    const ref = nextCookies['io.prismic.preview'] || null;

    const [recipes, nextRecipesList] = await Promise.all([
      fetchDocumentsByType({
        type: 'recipe',
        req,
        options: { pageSize: 100 }
      }),
      fetchDocumentsByType({ type: 'cook_next_list', req })
    ]);

    // Get ingredients for next recipes
    const nextRecipesListResults =
      nextRecipesList.results &&
      nextRecipesList.results[0] &&
      nextRecipesList.results[0].data;
    const nextIngredients = [];
    if (nextRecipesListResults) {
      const nextIDs = nextRecipesListResults.next_recipes.map(
        el => el.next_recipe.id
      );

      const nextRecipes = await fetchDocumentsByIDs({
        ids: nextIDs,
        req
      });

      if (nextRecipes.results) {
        const nextRecipeIngredients = nextRecipes.results
          .map(recipe => recipe.data.ingredient_slices)
          .flat()
          .filter(recipe => recipe.slice_type === 'ingredient')
          .map(ingredient => ingredient.primary.ingredient);
        nextIngredients.push(...nextRecipeIngredients);
      }
    }

    if (res)
      res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    return {
      recipes: recipes.results || [],
      nextIngredients
    };
  }

  constructor(props) {
    super(props);
    this.state = {
      isEditing: false
    };
  }

  toggleEditMode = () => {
    this.setState((state, props) => ({
      isEditing: !state.isEditing
    }));
  };

  render() {
    const { recipes, nextIngredients } = this.props;
    const { isEditing } = this.state;

    return (
      <div id="groceries" className="container">
        <div className="row">
          <div className="col-12 d-flex col-title">
            <h1>Grocery List</h1>
            <button
              className={isEditing ? 'edit-btn editing' : 'edit-btn'}
              onClick={this.toggleEditMode}
              type="button"
            >
              {!isEditing ? 'Edit' : 'Done'}
            </button>
          </div>
          <div className="col-12">
            {/* TODO:
                - Ability to select multiple recipes
                - Once a recipe is selected, add ingredients to list
                - Add "edit" button: ability to rearrange order
            */}
            {nextIngredients && (
              <GroceryList ingredients={nextIngredients} {...{ isEditing }} />
            )}
          </div>
        </div>
        <style jsx>{styles}</style>
      </div>
    );
  }
}

export default Groceries;
