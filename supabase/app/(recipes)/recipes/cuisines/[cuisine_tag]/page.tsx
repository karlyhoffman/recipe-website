import { notFound } from 'next/navigation';
import TagsDetailLayout from '@/components/TagsDetailLayout';
import { getCuisineTagByUid, getRecipesByCuisineTag, getCuisineTags } from '@/lib/data';

export default async function CuisineDetail({
  params,
}: {
  params: Promise<{ cuisine_tag: string }>;
}) {
  const { cuisine_tag: uid } = await params;
  const [tag, taggedRecipes] = await Promise.all([
    getCuisineTagByUid(uid),
    getRecipesByCuisineTag(uid),
  ]);

  if (!tag) notFound();

  return <TagsDetailLayout recipes={taggedRecipes} tagName={tag.name} />;
}

export async function generateStaticParams() {
  const tags = await getCuisineTags();
  return tags.map((tag) => ({ cuisine_tag: tag.uid }));
}
