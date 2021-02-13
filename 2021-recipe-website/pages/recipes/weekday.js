import { fetchRecipesByWeekendTag } from 'api/prismic-queries';
import { TagsDetailLayout } from 'components';

function TagDetail({ recipes }) {
  return <TagsDetailLayout recipes={recipes}>Weekday Meals</TagsDetailLayout>;
}

export default TagDetail;

export const getStaticProps = async ({ preview = false, previewData = {} }) => {
  const { ref } = previewData;
  const { results } = await fetchRecipesByWeekendTag({});

  return {
    props: {
      recipes: results || [],
      preview,
    },
    revalidate: 1,
  };
};
