import TagOverviewLayout from '@/components/TagOverviewLayout';
import { getIngredientTags } from '@/lib/data';

export default async function IngredientsOverview() {
  const tags = await getIngredientTags();
  return (
    <TagOverviewLayout
      tags={tags}
      tagType="ingredient"
      basePath="/recipes/ingredients"
      title="Main Ingredient Tags"
      totalCount={tags.length}
      pageSize={100}
      page={1}
    />
  );
}
