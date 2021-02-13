import {
  fetchSingleDocumentByTypeAndUID,
  fetchUIDsForType,
  fetchRecipesByTag,
} from 'api/prismic-queries';
import { TagsDetailLayout } from 'components';

function TagDetail({ recipes, tagName }) {
  return (
    <TagsDetailLayout recipes={recipes}>{tagName || null}</TagsDetailLayout>
  );
}

export default TagDetail;


const TAG_TYPE = 'ingredient_tag';

export const getStaticProps = async ({
  params,
  preview = false,
  previewData = {},
}) => {
  if (!params?.[TAG_TYPE]) return { notFound: true };

  const { ref } = previewData;
  const uid = params[TAG_TYPE];

  const { id: tagID, data } = await fetchSingleDocumentByTypeAndUID({
    type: TAG_TYPE,
    uid,
    options: { ref },
  });

  const { results } = await fetchRecipesByTag({
    tagID,
    type: TAG_TYPE,
    tagTypeName: 'main_ingredient_tag',
  });

  return {
    props: {
      tagName: data?.[TAG_TYPE],
      recipes: results || [],
      preview,
    },
    revalidate: 1,
  };
};

export const getStaticPaths = async () => {
  const uids = await fetchUIDsForType({ type: TAG_TYPE });
  const paths = uids.map((uid) => `/recipes/ingredients/${uid}`);
  return {
    paths,
    fallback: 'blocking',
  };
};
