import TagOverviewLayout from '@/components/TagOverviewLayout';
import { cuisineTags } from '@/lib/placeholder-data';

export default function CuisinesOverview() {
  return (
    <TagOverviewLayout
      tags={cuisineTags}
      tagType="cuisine"
      basePath="/recipes/cuisines"
      title="Cuisine Tags"
      totalCount={cuisineTags.length}
      pageSize={100}
      page={1}
    />
  );
}
