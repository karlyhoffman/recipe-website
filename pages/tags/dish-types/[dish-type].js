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

    const dishTypeTag = await fetchDocumentByUID({
      type: 'type_tag',
      id: query['dish-type'],
      req
    });

    if (dishTypeTag.results) {
      const recipes = await Client(req).query(
        [
          Prismic.Predicates.at('document.type', 'recipe'),
          Prismic.Predicates.at(
            'my.recipe.type_tags.type_tag',
            dishTypeTag.results[0].id
          )
        ],
        { orderings: '[my.recipe.title]', pageSize: 100 }
      );

      return {
        recipes: recipes.results || [],
        dishTypeTagName:
          (dishTypeTag.results &&
            dishTypeTag.results[0] &&
            dishTypeTag.results[0].data &&
            dishTypeTag.results[0].data.type_tag) ||
          ''
      };
    }

    return {
      recipes: [],
      dishTypeTagName: ''
    };
  }

  render() {
    const { dishTypeTagName, recipes } = this.props;

    return (
      <div id="tag-detail" className="container">
        <div className="row">
          <div className="col-12">
            <h1>
              {dishTypeTagName
                ? `${dishTypeTagName} Recipes`
                : 'Recipes By Dish Type Tag'}
            </h1>
            {recipes.length ? (
              <ul>
                {recipes.map(recipe => (
                  <li key={recipe.id}>
                    <Link href={linkResolver(recipe)}>
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
