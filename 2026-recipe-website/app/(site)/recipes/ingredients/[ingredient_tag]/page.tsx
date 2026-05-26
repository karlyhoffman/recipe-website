import { notFound } from 'next/navigation';
import TagsDetailLayout from '@/components/TagsDetailLayout';
import { getIngredientTagByUid, getRecipesByIngredientTag, getIngredientTags } from '@/lib/data';

export default async function IngredientDetail({
  params,
}: {
  params: Promise<{ ingredient_tag: string }>;
}) {
  const { ingredient_tag: uid } = await params;
  const [tag, taggedRecipes] = await Promise.all([
    getIngredientTagByUid(uid),
    getRecipesByIngredientTag(uid),
  ]);

  if (!tag) notFound();

  return <TagsDetailLayout recipes={taggedRecipes} tagName={tag.name} />;
}

export async function generateStaticParams() {
  const tags = await getIngredientTags();
  return tags.map((tag) => ({ ingredient_tag: tag.uid }));
}
