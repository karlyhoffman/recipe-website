import { notFound } from 'next/navigation';
import TagsDetailLayout from '@/components/TagsDetailLayout';
import { getSeasonTagByUid, getRecipesBySeasonTag, getSeasonTags } from '@/lib/data';

export default async function SeasonDetail({
  params,
}: {
  params: Promise<{ season_tag: string }>;
}) {
  const { season_tag: uid } = await params;
  const [tag, taggedRecipes] = await Promise.all([
    getSeasonTagByUid(uid),
    getRecipesBySeasonTag(uid),
  ]);

  if (!tag) notFound();

  return <TagsDetailLayout recipes={taggedRecipes} tagName={tag.name} />;
}

export async function generateStaticParams() {
  const tags = await getSeasonTags();
  return tags.map((tag) => ({ season_tag: tag.uid }));
}
