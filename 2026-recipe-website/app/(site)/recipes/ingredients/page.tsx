import TagOverviewLayout from '@/components/TagOverviewLayout';
import { ingredientTags } from '@/lib/placeholder-data';

export default function IngredientsOverview() {
  return (
    <TagOverviewLayout
      tags={ingredientTags}
      tagType="ingredient"
      basePath="/recipes/ingredients"
      title="Main Ingredient Tags"
      totalCount={ingredientTags.length}
      pageSize={100}
      page={1}
    />
  );
}
