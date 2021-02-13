import { fetchMultipleDocumentsByType } from 'api/prismic-queries';
import { TagOverviewLayout } from 'components';

const TAG_TYPE = 'ingredient_tag';

function IngredientTagsOverview(props) {
  return (
    <TagOverviewLayout {...props} type={TAG_TYPE}>
      Main Ingredient Tags
    </TagOverviewLayout>
  );
}

export default IngredientTagsOverview;

export const getStaticProps = async ({ preview = false, previewData = {} }) => {
  const { ref } = previewData;
  const { results } = await fetchMultipleDocumentsByType({
    type: TAG_TYPE,
    options: { ref, orderings: `[my.${TAG_TYPE}.${TAG_TYPE}]`, pageSize: 100 },
  });

  return {
    props: {
      tags: results || [],
      preview,
    },
    revalidate: 1,
  };
};
