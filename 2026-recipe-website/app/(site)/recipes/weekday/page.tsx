import TagsDetailLayout from '@/components/TagsDetailLayout';
import { recipes } from '@/lib/placeholder-data';

export default function WeekdayMeals() {
  const weekdayRecipes = recipes
    .filter((r) => r.weekday)
    .map(({ id, uid, title }) => ({ id, uid, title }));

  return <TagsDetailLayout recipes={weekdayRecipes} tagName="Weekday" />;
}
