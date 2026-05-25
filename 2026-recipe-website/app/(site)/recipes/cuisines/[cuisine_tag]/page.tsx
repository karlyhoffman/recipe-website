import { notFound } from 'next/navigation';
import TagsDetailLayout from '@/components/TagsDetailLayout';
import { cuisineTags, recipes } from '@/lib/placeholder-data';

export default async function CuisineDetail({
  params,
}: {
  params: Promise<{ cuisine_tag: string }>;
}) {
  const { cuisine_tag: uid } = await params;
  const tag = cuisineTags.find((t) => t.uid === uid);

  if (!tag) notFound();

  const taggedRecipes = recipes
    .filter((r) => r.cuisine_tags.some((t) => t.uid === uid))
    .map(({ id, uid, title }) => ({ id, uid, title }));

  return <TagsDetailLayout recipes={taggedRecipes} tagName={tag.name} />;
}

export async function generateStaticParams() {
  return cuisineTags.map((tag) => ({ cuisine_tag: tag.uid }));
}
