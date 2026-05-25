import { notFound } from 'next/navigation';
import TagsDetailLayout from '@/components/TagsDetailLayout';
import { typeTags, recipes } from '@/lib/placeholder-data';

export default async function DishTypeDetail({
  params,
}: {
  params: Promise<{ type_tag: string }>;
}) {
  const { type_tag: uid } = await params;
  const tag = typeTags.find((t) => t.uid === uid);

  if (!tag) notFound();

  const taggedRecipes = recipes
    .filter((r) => r.type_tags.some((t) => t.uid === uid))
    .map(({ id, uid, title }) => ({ id, uid, title }));

  return <TagsDetailLayout recipes={taggedRecipes} tagName={tag.name} />;
}

export async function generateStaticParams() {
  return typeTags.map((tag) => ({ type_tag: tag.uid }));
}
