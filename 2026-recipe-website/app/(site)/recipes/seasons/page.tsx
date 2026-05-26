import TagOverviewLayout from '@/components/TagOverviewLayout';
import { seasonTags } from '@/lib/placeholder-data';

export default function SeasonsOverview() {
  return (
    <TagOverviewLayout
      tags={seasonTags}
      tagType="season"
      basePath="/recipes/seasons"
      title="Season Tags"
      totalCount={seasonTags.length}
      pageSize={100}
      page={1}
    />
  );
}
