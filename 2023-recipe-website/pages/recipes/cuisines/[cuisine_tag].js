import { createClient } from 'prismicio';
import * as prismic from '@prismicio/client';
import * as prismicH from '@prismicio/helpers';
import { TagsDetailLayout } from 'components';

const TAG_TYPE = 'cuisine_tag';

export default function TagDetail({ recipes, tagName }) {
  return <TagsDetailLayout recipes={recipes}>{tagName || null}</TagsDetailLayout>;
}

export const getStaticProps = async ({ params, previewData = {} }) => {
  const client = createClient({ previewData });
  const uid = params[TAG_TYPE];

  try {
    const { id: tagID, data } = (await client.getByUID(TAG_TYPE, uid)) || {};
    const { results } = await client.get({
      predicates: [
        prismic.predicate.at('document.type', 'recipe'),
        prismic.predicate.at(`my.recipe.${TAG_TYPE}s.${TAG_TYPE}`, tagID),
      ],
    });

    return {
      props: {
        tagName: data?.[TAG_TYPE],
        recipes: results || [],
      },
      revalidate: 10,
    };
  } catch (error) {
    return { notFound: true };
  }
};

export async function getStaticPaths() {
  const client = createClient();
  const pages = await client.getAllByType(TAG_TYPE);

  return {
    paths: pages.map((page) => prismicH.asLink(page)),
    fallback: 'blocking',
  };
}
