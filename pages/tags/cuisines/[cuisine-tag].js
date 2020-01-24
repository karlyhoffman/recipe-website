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

    const cuisineTag = await fetchDocumentByUID({
      type: 'cuisine_tag',
      id: query['cuisine-tag'],
      req
    });

    if (cuisineTag.results) {
      const recipes = await Client(req).query(
        [
          Prismic.Predicates.at('document.type', 'recipe'),
          Prismic.Predicates.at(
            'my.recipe.cuisine_tags.cuisine_tag',
            cuisineTag.results[0].id
          )
        ],
        { orderings: '[my.recipe.title]', pageSize: 100 }
      );

      return {
        recipes: recipes.results || [],
        cuisineTagName:
          (cuisineTag.results &&
            cuisineTag.results[0] &&
            cuisineTag.results[0].data &&
            cuisineTag.results[0].data.cuisine_tag) ||
          ''
      };
    }

    return {
      recipes: [],
      cuisineTagName: ''
    };
  }

  render() {
    const { cuisineTagName, recipes } = this.props;

    return (
      <div id="tag-detail" className="container">
        <div className="row">
          <div className="col-12">
            <h1>
              {cuisineTagName
                ? `${cuisineTagName} Recipes`
                : 'Recipes By Cuisine Tag'}
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
