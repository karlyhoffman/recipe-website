import React, { Component } from 'react';
import getCookies from 'next-cookies';
import Link from 'next/link';
import { RichText } from 'prismic-reactjs';
// import PaginationCount from '../components/PaginationCount';
import { fetchRecipesBySearchTerm, linkResolver } from '../lib/api';

const QUERY_SIZE = 100;

class Search extends Component {
  static async getInitialProps(context) {
    const { req, res, query } = context;
    const nextCookies = getCookies(context);
    const ref = nextCookies['io.prismic.preview'] || null;
    const page = query.page || 1;

    let searchResults = { results: [] };

    if (query.search && query.search.length) {
      const term = query.search.replace(/"/g, '');
      searchResults = await fetchRecipesBySearchTerm({
        term,
        req,
        options: { orderings: '[my.recipe.title]', pageSize: QUERY_SIZE, page }
      });
    }

    if (res)
      res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    return {
      searchResults,
      query
    };
  }

  render() {
    const { query, searchResults } = this.props;

    return (
      <div id="search-page" className="container">
        <div className="row">
          {query.search && query.search.length ? (
            <div className="col-12">
              <h1>Search Results for &quot;{query.search}&quot;</h1>
              {searchResults.results.length ? (
                <ul className="recipe-list">
                  {searchResults.results.map(recipe => (
                    <li key={recipe.id}>
                      <Link {...linkResolver(recipe)}>
                        <a>{RichText.asText(recipe.data.title)}</a>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No results found.</p>
              )}
            </div>
          ) : (
            <div className="col-12">
              <h1>Search</h1>
              <p>Use the search bar to find recipes.</p>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default Search;
