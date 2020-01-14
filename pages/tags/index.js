import React, { Component } from 'react';
import getCookies from 'next-cookies';
import { fetchDocumentsByType } from '../../utils/prismic';
import styles from '../../styles/homepage.scss';

class TagsOverview extends Component {
  static async getInitialProps(context) {
    const { req, res } = context;
    const nextCookies = getCookies(context);
    const ref = nextCookies['io.prismic.preview'] || null;

    const [
      cuisineTags,
      ingredientTags,
      seasonTags,
      dishTypeTags,
      dayTags
    ] = await Promise.all([
      fetchDocumentsByType({ type: 'cuisine_tag', req }),
      fetchDocumentsByType({ type: 'ingredient_tag', req }),
      fetchDocumentsByType({ type: 'season_tag', req }),
      fetchDocumentsByType({ type: 'type_tag', req }),
      fetchDocumentsByType({ type: 'day_tag', req })
    ]);

    if (res)
      res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    return {
      cuisineTags: cuisineTags.results || [],
      ingredientTags: ingredientTags.results || [],
      seasonTags: seasonTags.results || [],
      dishTypeTags: dishTypeTags.results || [],
      dayTags: dayTags.results || []
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
      dayTags
    } = this.props;

    console.log({
      cuisineTags,
      ingredientTags,
      seasonTags,
      dishTypeTags,
      dayTags
    });

    return (
      <div id="tags-overview">
        <h1>View Recipes By Tags</h1>

        <style jsx>{styles}</style>
      </div>
    );
  }
}

export default TagsOverview;
