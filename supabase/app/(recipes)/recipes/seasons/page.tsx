import TagOverviewLayout from '@/components/TagOverviewLayout';
import { getSeasonTags } from '@/lib/data';

export default async function SeasonsOverview() {
  const tags = await getSeasonTags();
  return (
    <TagOverviewLayout
      tags={tags}
      tagType="season"
      basePath="/recipes/seasons"
      title="Season Tags"
      totalCount={tags.length}
      pageSize={100}
      page={1}
    />
  );
}
