import React, { Component } from 'react';
import getCookies from 'next-cookies';
import { fetchDocumentsByType, Client, Prismic } from '../utils/prismic';

class RecipeSearch extends Component {
  static async getInitialProps(context) {
    const { req, res } = context;
    const nextCookies = getCookies(context);
    const ref = nextCookies['io.prismic.preview'] || null;

    const [
      cuisineTags,
      ingredientTags,
      seasonTags,
      dishTypeTags,
      weekdayTags
    ] = await Promise.all([
      fetchDocumentsByType({ type: 'cuisine_tag', req }),
      fetchDocumentsByType({ type: 'ingredient_tag', req }),
      fetchDocumentsByType({ type: 'season_tag', req }),
      fetchDocumentsByType({ type: 'type_tag', req }),
      Client(req).query(Prismic.Predicates.at('my.recipe.weekday_tag', 'Yes'), {
        orderings: '[my.recipe.title]',
        pageSize: 100
      })
    ]);

    if (res)
      res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    return {
      cuisineTags: cuisineTags.results || [],
      ingredientTags: ingredientTags.results || [],
      seasonTags: seasonTags.results || [],
      dishTypeTags: dishTypeTags.results || [],
      weekdayTags
    };
  }

  fetchRecipeByTagType = () => {
    // TODO: listen for tag click, update results and query params
  };

  render() {
    const {
      cuisineTags,
      ingredientTags,
      seasonTags,
      dishTypeTags,
      weekdayTags
    } = this.props;

    console.log({
      cuisineTags,
      ingredientTags,
      seasonTags,
      dishTypeTags,
      weekdayTags
    });

    return (
      <div id="tags-overview" className="container">
        <div className="row">
          <div className="col-12">
            <h1>Tag Categories</h1>
          </div>
        </div>
      </div>
    );
  }
}

export default RecipeSearch;
