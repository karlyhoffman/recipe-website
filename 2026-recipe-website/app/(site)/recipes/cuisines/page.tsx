import TagOverviewLayout from '@/components/TagOverviewLayout';
import { getCuisineTags } from '@/lib/data';

export default async function CuisinesOverview() {
  const tags = await getCuisineTags();
  return (
    <TagOverviewLayout
      tags={tags}
      tagType="cuisine"
      basePath="/recipes/cuisines"
      title="Cuisine Tags"
      totalCount={tags.length}
      pageSize={100}
      page={1}
    />
  );
}
