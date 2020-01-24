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

    const seasonTag = await fetchDocumentByUID({
      type: 'season_tag',
      id: query.season,
      req
    });

    if (seasonTag.results) {
      const recipes = await Client(req).query(
        [
          Prismic.Predicates.at('document.type', 'recipe'),
          Prismic.Predicates.at(
            'my.recipe.season_tags.season_tag',
            seasonTag.results[0].id
          )
        ],
        { orderings: '[my.recipe.title]', pageSize: 100 }
      );

      return {
        recipes: recipes.results || [],
        seasonTagName:
          (seasonTag.results &&
            seasonTag.results[0] &&
            seasonTag.results[0].data &&
            seasonTag.results[0].data.season_tag) ||
          ''
      };
    }

    return {
      recipes: [],
      seasonTagName: ''
    };
  }

  render() {
    const { seasonTagName, recipes } = this.props;

    return (
      <div id="tag-detail" className="container">
        <div className="row">
          <div className="col-12">
            <h1>
              {seasonTagName
                ? `${seasonTagName} Recipes`
                : 'Recipes By Season Tag'}
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
