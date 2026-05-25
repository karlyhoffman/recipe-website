import { notFound } from 'next/navigation';
import TagsDetailLayout from '@/components/TagsDetailLayout';
import { seasonTags, recipes } from '@/lib/placeholder-data';

export default async function SeasonDetail({
  params,
}: {
  params: Promise<{ season_tag: string }>;
}) {
  const { season_tag: uid } = await params;
  const tag = seasonTags.find((t) => t.uid === uid);

  if (!tag) notFound();

  const taggedRecipes = recipes
    .filter((r) => r.season_tags.some((t) => t.uid === uid))
    .map(({ id, uid, title }) => ({ id, uid, title }));

  return <TagsDetailLayout recipes={taggedRecipes} tagName={tag.name} />;
}

export async function generateStaticParams() {
  return seasonTags.map((tag) => ({ season_tag: tag.uid }));
}
