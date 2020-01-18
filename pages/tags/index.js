import React, { Component } from 'react';
import getCookies from 'next-cookies';
import { fetchDocumentsByType } from '../../utils/prismic';
import '../../styles/pages/homepage.scss';

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
      weekdayTags
    ] = await Promise.all([
      fetchDocumentsByType({ type: 'cuisine_tag', req }),
      fetchDocumentsByType({ type: 'ingredient_tag', req }),
      fetchDocumentsByType({ type: 'season_tag', req }),
      fetchDocumentsByType({ type: 'type_tag', req }),
      fetchDocumentsByType({ type: 'weekday_tag', req })
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
      <div id="tags-overview">
        <h1>View Recipes By Tags</h1>
      </div>
    );
  }
}

export default TagsOverview;
