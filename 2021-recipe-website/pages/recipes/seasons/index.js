import { fetchMultipleDocumentsByType } from 'api/prismic-queries';
import { TagOverviewLayout } from 'components';

const TAG_TYPE = 'season_tag';

function SeasonTagsOverview(props) {
  return (
    <TagOverviewLayout {...props} type={TAG_TYPE}>
      Season Tags
    </TagOverviewLayout>
  );
}

export default SeasonTagsOverview;

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
