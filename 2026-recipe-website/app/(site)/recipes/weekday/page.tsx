import TagsDetailLayout from '@/components/TagsDetailLayout';
import { getWeekdayRecipes } from '@/lib/data';

export default async function WeekdayMeals() {
  const weekdayRecipes = await getWeekdayRecipes();
  return <TagsDetailLayout recipes={weekdayRecipes} tagName="Weekday" />;
}
