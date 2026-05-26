import TagOverviewLayout from '@/components/TagOverviewLayout';
import { typeTags } from '@/lib/placeholder-data';

export default function DishTypesOverview() {
  return (
    <TagOverviewLayout
      tags={typeTags}
      tagType="type"
      basePath="/recipes/dish-types"
      title="Dish Types"
      totalCount={typeTags.length}
      pageSize={100}
      page={1}
    />
  );
}
