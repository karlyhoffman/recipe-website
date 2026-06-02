import TagOverviewLayout from '@/components/TagOverviewLayout';
import { getTypeTags } from '@/lib/data';

export default async function DishTypesOverview() {
  const tags = await getTypeTags();
  return (
    <TagOverviewLayout
      tags={tags}
      tagType="type"
      basePath="/recipes/dish-types"
      title="Dish Types"
      totalCount={tags.length}
      pageSize={100}
      page={1}
    />
  );
}
