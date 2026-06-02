import { notFound } from 'next/navigation';
import TagsDetailLayout from '@/components/TagsDetailLayout';
import { getTypeTagByUid, getRecipesByTypeTag, getTypeTags } from '@/lib/data';

export default async function DishTypeDetail({
  params,
}: {
  params: Promise<{ type_tag: string }>;
}) {
  const { type_tag: uid } = await params;
  const [tag, taggedRecipes] = await Promise.all([
    getTypeTagByUid(uid),
    getRecipesByTypeTag(uid),
  ]);

  if (!tag) notFound();

  return <TagsDetailLayout recipes={taggedRecipes} tagName={tag.name} />;
}

export async function generateStaticParams() {
  const tags = await getTypeTags();
  return tags.map((tag) => ({ type_tag: tag.uid }));
}
