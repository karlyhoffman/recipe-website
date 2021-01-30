import React, { Component } from 'react';
import getCookies from 'next-cookies';
import Link from 'next/link';
import { RichText } from 'prismic-reactjs';
import {
  Prismic,
  Client,
  fetchDocumentByUID,
  linkResolver
} from '../../../utils/prismic';

class TagDetail extends Component {
  static async getInitialProps(context) {
    const { req, res, query } = context;
    const nextCookies = getCookies(context);
    const ref = nextCookies['io.prismic.preview'] || null;

    if (res)
      res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    const ingredientTag = await fetchDocumentByUID({
      type: 'ingredient_tag',
      id: query['ingredient-tag'],
      req
    });

    if (ingredientTag.results) {
      const recipes = await Client(req).query(
        [
          Prismic.Predicates.at('document.type', 'recipe'),
          Prismic.Predicates.at(
            'my.recipe.main_ingredient_tags.ingredient_tag',
            ingredientTag.results[0].id
          )
        ],
        { orderings: '[my.recipe.title]', pageSize: 100 }
      );

      return {
        recipes: recipes.results || [],
        ingredientTagName:
          (ingredientTag.results &&
            ingredientTag.results[0] &&
            ingredientTag.results[0].data &&
            ingredientTag.results[0].data.ingredient_tag) ||
          ''
      };
    }

    return {
      recipes: [],
      ingredientTagName: ''
    };
  }

  render() {
    const { ingredientTagName, recipes } = this.props;

    return (
      <div id="tag-detail" className="container">
        <div className="row">
          <div className="col-12">
            <h1>
              {ingredientTagName
                ? `${ingredientTagName} Recipes`
                : 'Recipes By Ingredient Tag'}
            </h1>
            {recipes.length ? (
              <ul>
                {recipes.map(recipe => (
                  <li key={recipe.id}>
                    <Link {...linkResolver(recipe)}>
                      <a>{RichText.asText(recipe.data.title)}</a>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                <strong>No recipes found.</strong>
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default TagDetail;
