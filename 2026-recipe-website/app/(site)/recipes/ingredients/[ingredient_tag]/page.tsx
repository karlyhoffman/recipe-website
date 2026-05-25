import { notFound } from 'next/navigation';
import TagsDetailLayout from '@/components/TagsDetailLayout';
import { ingredientTags, recipes } from '@/lib/placeholder-data';

export default async function IngredientDetail({
  params,
}: {
  params: Promise<{ ingredient_tag: string }>;
}) {
  const { ingredient_tag: uid } = await params;
  const tag = ingredientTags.find((t) => t.uid === uid);

  if (!tag) notFound();

  const taggedRecipes = recipes
    .filter((r) => r.ingredient_tags.some((t) => t.uid === uid))
    .map(({ id, uid, title }) => ({ id, uid, title }));

  return <TagsDetailLayout recipes={taggedRecipes} tagName={tag.name} />;
}

export async function generateStaticParams() {
  return ingredientTags.map((tag) => ({ ingredient_tag: tag.uid }));
}
