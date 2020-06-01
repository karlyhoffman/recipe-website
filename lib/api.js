/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
import Prismic from 'prismic-javascript';

const REPOSITORY = process.env.PRISMIC_REPOSITORY_NAME;
const REF_API_URL = `https://${REPOSITORY}.prismic.io/api/v2`;
const GRAPHQL_API_URL = `https://${REPOSITORY}.prismic.io/graphql`;
export const API_TOKEN = process.env.PRISMIC_ACCESS_TOKEN;

export const PrismicClient = Prismic.client(REF_API_URL, {
  accessToken: API_TOKEN
});

async function fetchAPI(query, { previewData, variables } = {}) {
  const prismicAPI = await PrismicClient.getApi();
  const res = await fetch(
    `${GRAPHQL_API_URL}?query=${query}&variables=${JSON.stringify(variables)}`,
    {
      headers: {
        'Prismic-Ref': previewData?.ref || prismicAPI.masterRef.ref,
        'Content-Type': 'application/json',
        'Accept-Language': 'en-us',
        Authorization: `Token ${API_TOKEN}`
      }
    }
  );

  if (res.status !== 200) {
    console.log(await res.text());
    throw new Error('Failed to fetch API');
  }

  const json = await res.json();
  if (json.errors) {
    console.error(json.errors);
    throw new Error('Failed to fetch API');
  }
  return json.data;
}

let frontClient;

export const Client = (req = null) => {
  // prevent generate new instance for client side since we don't need the refreshed request object.
  if (!req && frontClient) return frontClient;

  const options = {
    ...(req ? { req } : {}),
    ...(process.env.PRISMIC_ACCESS_TOKEN
      ? { accessToken: process.env.PRISMIC_ACCESS_TOKEN }
      : {})
  };
  return Prismic.client(process.env.PRISMIC_API_URL, options);
};

export const fetchDocumentsByType = async ({ type, req = null, options }) =>
  Client(req).query(Prismic.Predicates.at('document.type', type), options);

export const fetchRecipesBySearchTerm = async ({ term, req = null, options }) =>
  Client(req).query(
    [
      Prismic.Predicates.at('document.type', 'recipe'),
      Prismic.Predicates.fulltext('document', term)
    ],
    options
  );

export async function getHomepageRecipeLists() {
  const data = await fetchAPI(`
    {
      allCook_next_lists {
        edges {
          node {
            next_recipes {
              next_recipe {
                ... on Recipe {
                  title,
                  _meta {
                    id,
                    uid
                  }
                }
              }
            }
          }
        }
      },
      allFavorites_lists {
        edges {
          node {
            favorite_recipes {
              favorite_recipe {
                ... on Recipe {
                  title,
                  _meta {
                    id,
                    uid
                  }
                }
              }
            }
          }
        }
      }
    },
  `);
  return data;
}

export async function getAllRecipesWithSlug() {
  const data = await fetchAPI(`
    {
      allRecipes {
        edges {
          node {
            _meta {
              uid
            }
          }
        }
      }
    }
  `);
  return data?.allRecipes?.edges;
}

export async function getRecipe(recipe) {
  const data = await fetchAPI(
    `query RecipeBySlug($uid: String!, $lang: String!) {
        recipe(uid: $uid, lang: $lang) {
          title,
          source,
          servings,
          cost,
          minutes_prep,
          minutes_total,
          recipe_photo,
          recipe_notes,
          related_recipes {
            related_recipe {
              ... on Recipe {
                title,
                _meta {
                  id,
                  uid
                }
              }
            }
          },
          ingredient_slices {
            ... on RecipeIngredient_slicesIngredient_heading {
              type,
              primary {
                ingredient_heading
              }
            }
            ... on RecipeIngredient_slicesIngredient {
              type,
              primary {
                ingredient
              }
            }
          }
          body {
            ... on RecipeBodyInstruction_heading {
              type,
              primary {
                instruction_heading
              }
            }
            ... on RecipeBodyRecipe_instruction {
              type,
              primary {
                instruction
              }
            }
          },
          main_ingredient_tags {
            ingredient_tag {
              ... on Ingredient_tag {
                ingredient_tag,
                _meta {
                  id,
                  uid
                }
              }
            }
          },
          cuisine_tags {
            cuisine_tag {
              ... on Cuisine_tag {
                cuisine_tag,
                _meta {
                  id,
                  uid
                }
              }
            }
          },
          type_tags {
            type_tag {
              ... on Type_tag {
                type_tag,
                _meta {
                  id,
                  uid
                }
              }
            }
          },
          season_tags {
            season_tag {
              ... on Season_tag {
                season_tag,
                _meta {
                  id,
                  uid
                }
              }
            }
          },
          weekday_tag,
          _meta {
            id,
            uid
          }
        }
      }
    `,
    {
      variables: {
        uid: recipe,
        lang: 'en-us'
      }
    }
  );
  return data;
}

export const linkResolver = doc => {
  if (doc && doc.type) {
    if (doc.type === 'recipe')
      return { href: '/recipes/[recipe]', as: `/recipes/${doc.uid}` };

    if (doc.type === 'ingredient_tag')
      return {
        href: '/recipes/ingredients/[ingredient-tag]',
        as: `/recipes/ingredients/${doc.uid}`
      };

    if (doc.type === 'cuisine_tag')
      return {
        href: '/recipes/cuisines/[cuisine-tag]',
        as: `/recipes/cuisines/${doc.uid}`
      };

    if (doc.type === 'type_tag')
      return {
        href: '/recipes/dish-types/[dish-type]',
        as: `/recipes/dish-types/${doc.uid}`
      };

    if (doc.type === 'season_tag')
      return {
        href: '/recipes/seasons/[season]',
        as: `/recipes/seasons/${doc.uid}`
      };
  }

  return {
    href: '/index',
    as: `/`
  };
};
