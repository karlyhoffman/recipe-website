import { createClient } from 'prismicio';
import * as prismic from '@prismicio/client';
import { TagsDetailLayout } from 'components';

export default function TagDetail({ recipes, tagName }) {
  return <TagsDetailLayout recipes={recipes}>{tagName || null}</TagsDetailLayout>;
}

export const getStaticProps = async ({ previewData }) => {
  const client = createClient({ previewData });

  try {
    const { results } = await client.get({
      predicates: [prismic.predicate.at('my.recipe.weekday_tag', 'Yes')],
    });

    return {
      props: {
        tagName: 'Weekday',
        recipes: results || [],
      },
      revalidate: 10,
    };
  } catch (error) {
    return { notFound: true };
  }
};
