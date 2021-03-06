import { fetchMultipleDocumentsByType } from 'api/prismic-queries';
import { TagOverviewLayout } from 'components';

const TAG_TYPE = 'cuisine_tag';
const QUERY_SIZE = 100;

function CuisineOverview(props) {
  return (
    <TagOverviewLayout {...props} type={TAG_TYPE}>
      Cuisine Tags
    </TagOverviewLayout>
  );
}

export default CuisineOverview;

CuisineOverview.getInitialProps = async (context) => {
  const { req, res, query } = context;
  const page = query?.page || 1;

  const { results, total_results_size } = await fetchMultipleDocumentsByType({
    type: TAG_TYPE,
    req,
    options: {
      orderings: `[my.${TAG_TYPE}.${TAG_TYPE}]`,
      pageSize: QUERY_SIZE,
      page,
    },
  });

  if (res) res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

  return {
    tags: results || [],
    totalCount: total_results_size || 0,
    pageSize: QUERY_SIZE,
    page,
  };
};
