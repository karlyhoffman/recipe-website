import React, { Component } from 'react';
import getCookies from 'next-cookies';
import { RichText } from 'prismic-reactjs';
import { fetchDocumentByUID } from '../../utils/prismic';
import StickyElement from '../../components/StickyElement';
import '../../styles/pages/recipe-detail.scss';

class RecipeDetail extends Component {
  static async getInitialProps(context) {
    const { req, res, query } = context;
    const nextCookies = getCookies(context);
    const ref = nextCookies['io.prismic.preview'] || null;

    const id = query.recipe;
    const recipe = await fetchDocumentByUID({ type: 'recipe', id, req });

    if (res)
      res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    return { recipe: recipe.results[0] || {} };
  }

  constructor(props) {
    super(props);

    this.stickyContainer = React.createRef();
    this.instructionsColumn = React.createRef();
  }

  formatTime = time => {
    const hours = Math.floor(time / 60);
    const minutes = time % 60 < 10 ? `0${time % 60}` : time % 60;
    return `${hours}:${minutes}`;
  };

  renderTextSlice = ({ slice_type: type, primary }) => {
    switch (type) {
      case 'ingredient_heading':
        return RichText.render(primary.ingredient_heading);
      case 'ingredient':
        return RichText.render(primary.ingredient);
      case 'instruction_heading':
        return RichText.render(primary.instruction_heading);
      case 'recipe_instruction':
        return RichText.render(primary.instruction);
      default:
        return null;
    }
  };

  render() {
    const { recipe } = this.props;

    if (!recipe.data) return <div>No Recipe Data Found</div>;

    const {
      title,
      source,
      servings,
      cost,
      minutes_prep: prepTime,
      minutes_total: totalTime,
      last_cooked_date: lastCooked,
      recipe_photo: photo,
      color,
      recipe_notes: notes,
      ingredient_slices: ingredients,
      body: instructions,
      related_recipes: relatedRecipes,
      main_ingredient_tags: ingredientTags,
      cuisine_tags: cuisineTags,
      type_tags: typeTags,
      season_tags: seasonTags,
      weekday_tag: weekdayTag
    } = recipe.data;

    const hasHeroImg = photo && photo.url;

    return (
      <div id="recipe-detail" className="container-fluid px-0">
        <div
          className="hero-img"
          style={{
            backgroundColor: color || '#232323'
          }}
        >
          {hasHeroImg && <img src={photo.url} alt="" />}
        </div>

        <div
          className={`body container-fluid ${hasHeroImg ? 'has-hero-img' : ''}`}
        >
          <div className="container">
            <div className="row">
              <div className="col-12">
                <h1 style={{ color: hasHeroImg ? '#333' : color }}>
                  {RichText.asText(title)}
                </h1>
              </div>
            </div>
            <div className="row about">
              <div className="col-12 col-md-6 col-lg-3">
                {prepTime && (
                  <p>
                    <strong>Prep</strong>: {this.formatTime(prepTime)}
                  </p>
                )}
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                {totalTime && (
                  <p>
                    <strong>Total Time</strong>: {this.formatTime(totalTime)}
                  </p>
                )}
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                {servings && (
                  <p>
                    <strong>Servings</strong>: {servings}
                  </p>
                )}
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                {cost && (
                  <p>
                    <strong>Estimated Cost</strong>: ${cost}
                  </p>
                )}
              </div>
              {notes && RichText.asText(notes) && (
                <div className="col-12 notes">
                  <strong>Notes:</strong>
                  {RichText.render(notes)}
                </div>
              )}
              {source && !!source.length && (
                <div className="col-12 source d-flex">
                  <p className="label">Source:</p>
                  {RichText.render(source)}
                </div>
              )}
              <div className="col-12">
                <div className="line" />
              </div>
            </div>
          </div>

          <div className="container">
            <div className="row steps" ref={this.stickyContainer}>
              <div className="col-12 col-md-4 ingredients">
                <StickyElement
                  parentContainer={this.stickyContainer}
                  sibling={this.instructionsColumn}
                >
                  <h2 className="heading">Ingredients</h2>
                  {ingredients &&
                    React.Children.toArray(
                      ingredients.map(ingredient =>
                        this.renderTextSlice(ingredient)
                      )
                    )}
                </StickyElement>
              </div>
              <div className="col-12 col-md-8 instructions">
                <div ref={this.instructionsColumn}>
                  <h2 className="heading">Instructions</h2>
                  {instructions &&
                    React.Children.toArray(
                      instructions.map(instruction =>
                        this.renderTextSlice(instruction)
                      )
                    )}
                </div>
              </div>
              <div className="col-12">
                <div className="line" />
              </div>
            </div>

            {/* TODO: Filter out blank documents */}
            {relatedRecipes && !!relatedRecipes.length && (
              <div className="row related">
                <div className="col-12">
                  <h2>Related Recipes</h2>
                </div>
                <div className="col-12">
                  <div className="line" />
                </div>
              </div>
            )}

            <div className="row tags">
              <div className="col-12">
                <h2>Tags</h2>
              </div>
              {ingredientTags && (
                <div className="col-12 col-md-4">
                  <h3>Ingredients</h3>
                </div>
              )}
              {cuisineTags && (
                <div className="col-12 col-md-4">
                  <h3>Cuisine</h3>
                </div>
              )}
              {typeTags && (
                <div className="col-12 col-md-4">
                  <h3>Dish Type</h3>
                </div>
              )}
              {seasonTags && (
                <div className="col-12 col-md-4">
                  <h3>Season</h3>
                </div>
              )}
              {weekdayTag && weekdayTag === 'Yes' && (
                <div className="col-12 col-md-4">
                  <h3>Weekday</h3>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default RecipeDetail;
