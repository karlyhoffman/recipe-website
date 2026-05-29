import { createClient } from 'prismicio';
import { TagOverviewLayout } from 'components';

const TAG_TYPE = 'cuisine_tag';
const QUERY_SIZE = 100;

export default function CuisineOverview(props) {
  return (
    <TagOverviewLayout {...props} type={TAG_TYPE}>
      Cuisine Tags
    </TagOverviewLayout>
  );
}

CuisineOverview.getInitialProps = async ({ res, query }) => {
  const page = query?.page || 1;
  const client = createClient();

  const { results, total_results_size } = await client.getByType(TAG_TYPE, {
    orderings: { field: `my.${TAG_TYPE}.${TAG_TYPE}` },
    pageSize: QUERY_SIZE,
    page,
  });

  if (res) res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

  return {
    tags: results || [],
    totalCount: total_results_size || 0,
    pageSize: QUERY_SIZE,
    page,
  };
};
