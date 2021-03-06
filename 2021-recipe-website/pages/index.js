import Link from 'next/link';
import { RichText } from 'prismic-reactjs';
import { linkResolver } from 'api/prismic-configuration';
import { fetchSingleDocumentByType, fetchMultipleDocumentsByType } from 'api/prismic-queries';
import stylesCards from 'styles/components/cards.module.scss';

function Homepage({
  nextRecipes = [],
  favoriteRecipes = [],
  recentlyAddedRecipes = [],
  randomRecipes = [],
}) {
  return (
    <div className="container">
      <div className="row">
        <div className="col-12">
          <h1>5047 Cooking</h1>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <h2>Recipes to Cook Next</h2>
          <div className={stylesCards.card_container}>
            {nextRecipes.map(
              ({
                next_recipe,
                next_recipe: {
                  id,
                  data: { title },
                },
              }) => (
                <Link key={id} href={linkResolver(next_recipe)}>
                  <a className={stylesCards.card}>{RichText.asText(title)}</a>
                </Link>
              )
            )}
          </div>
        </div>
      </div>

      <div className="row mt-md-3">
        <div className="col-12 col-md-6">
          <h2>Favorite Recipes</h2>
          {!!favoriteRecipes.length ? (
            <ul>
              {favoriteRecipes.map(
                ({
                  favorite_recipe,
                  favorite_recipe: {
                    id,
                    data: { title },
                  },
                }) => (
                  <li key={id}>
                    <Link href={linkResolver(favorite_recipe)}>
                      <a>{RichText.asText(title)}</a>
                    </Link>
                  </li>
                )
              )}
            </ul>
          ) : (
            <p>No recipes available.</p>
          )}
        </div>

        <div className="col-12 col-md-6">
          <h2>Recently Added</h2>
          {!!recentlyAddedRecipes.length ? (
            <ul>
              {recentlyAddedRecipes.map((recipe) => {
                const {
                  id,
                  data: { title },
                } = recipe;

                return (
                  <li key={id}>
                    <Link href={linkResolver(recipe)}>
                      <a>{RichText.asText(title)}</a>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>No recipes available.</p>
          )}
        </div>

        <div className="col-12 col-md-6">
          <h2>Ideas for Next Week</h2>
          {!!randomRecipes.length ? (
            <ul>
              {randomRecipes.map((recipe) => {
                const {
                  id,
                  data: { title },
                } = recipe;

                return (
                  <li key={id}>
                    <Link href={linkResolver(recipe)}>
                      <a>{RichText.asText(title)}</a>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>No recipes available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Homepage;

const pageSize = 10;
const fetchLinks = ['recipe.title'];

function randomPageNumber(num) {
  const min = 2;       // page other than first page (used for recentlyAddedRecipes)
  const max = num - 1; // skip last page (will have fewer results)
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export const getStaticProps = async ({ preview = false, previewData = {} }) => {
  const { ref } = previewData;
  const { total_pages } = await fetchMultipleDocumentsByType({ type: 'recipe', options: { pageSize } });

  const [
    nextRecipesData,
    favoriteRecipesData,
    recentlyAddedRecipes,
    randomRecipes,
  ] = await Promise.all([
    fetchSingleDocumentByType({ type: 'cook_next_list', options: { ref, fetchLinks } }),
    fetchSingleDocumentByType({ type: 'favorites_list', options: { ref, fetchLinks } }),
    fetchMultipleDocumentsByType({
      type: 'recipe',
      options: {
        orderings: '[document.first_publication_date desc]',
        page: 1,
        pageSize,
      },
    }),
    fetchMultipleDocumentsByType({
      type: 'recipe',
      options: {
        orderings: '[document.first_publication_date desc]',
        page: randomPageNumber(total_pages),
        pageSize,
      },
    }),
  ]);

  return {
    props: {
      nextRecipes: nextRecipesData?.data?.next_recipes || [],
      favoriteRecipes: favoriteRecipesData?.data?.favorite_recipes || [],
      recentlyAddedRecipes: recentlyAddedRecipes?.results || [],
      randomRecipes: randomRecipes?.results || [],
      preview,
    },
    revalidate: 1,
  };
};
