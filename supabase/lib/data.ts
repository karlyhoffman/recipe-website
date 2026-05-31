import type { Recipe, RecipeSummary, Tag, IngredientSlice, InstructionSlice } from '@/types';
import { createClient } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Internal row types (PostgREST returns snake_case column names)
// ---------------------------------------------------------------------------

// Nested-relation shapes returned by Supabase for joined selects.
// Without generated types, Supabase infers all related tables as arrays,
// so we match that shape and use flatMap where only one item per row is expected.
type RecipeTagResult = { recipe_id: string; tags: TagRow[] | null };
type RelatedRecipeResult = { recipe_id: string; position: number; recipes: RecipeSummary[] | null };
type CurationResult = { position: number; recipes: RecipeSummary[] | null };
type TagRecipeResult = { recipes: RecipeSummary[] | null };
type RecipeRow = {
  id: string;
  uid: string;
  title: string;
  prep_minutes: number | null;
  total_minutes: number | null;
  servings: number | null;
  notes: string | null;
  source: string | null;
  weekday: boolean;
  status: 'draft' | 'published';
  import_source: string | null;
};

type IngredientRow = {
  id: string;
  recipe_id: string;
  position: number;
  type: 'heading' | 'ingredient';
  name: string;
  amount: string | null;
  preparation: string | null;
  aisle: string | null;
};

type InstructionRow = {
  id: string;
  recipe_id: string;
  position: number;
  type: 'heading' | 'instruction';
  text: string;
};

type TagRow = { id: string; uid: string; name: string; category: string };

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------
function mapIngredient(row: IngredientRow): IngredientSlice {
  return {
    type: row.type,
    name: row.name,
    amount: row.amount ?? undefined,
    preparation: row.preparation ?? undefined,
    aisle: row.aisle ?? undefined,
  };
}

function mapInstruction(row: InstructionRow): InstructionSlice {
  return { type: row.type, text: row.text };
}

function mapTag(row: TagRow): Tag {
  return { id: row.id, uid: row.uid, name: row.name };
}

// ---------------------------------------------------------------------------
// hydrateRecipes — fetch child records for a set of recipe rows and assemble
// fully-hydrated Recipe objects. Used by getRecipeByUid and getCookNextRecipes.
// ---------------------------------------------------------------------------
async function hydrateRecipes(
  supabase: ReturnType<typeof createClient>,
  recipeRows: RecipeRow[],
): Promise<Recipe[]> {
  if (recipeRows.length === 0) return [];

  const ids = recipeRows.map((r) => r.id);

  const [
    { data: ingredients },
    { data: instructions },
    { data: recipeTags },
    { data: relatedLinks },
  ] = await Promise.all([
    supabase
      .from('ingredient_entries')
      .select('id, recipe_id, position, type, name, amount, preparation, aisle')
      .in('recipe_id', ids)
      .order('position'),
    supabase
      .from('instruction_entries')
      .select('id, recipe_id, position, type, text')
      .in('recipe_id', ids)
      .order('position'),
    supabase
      .from('recipe_tags')
      .select('recipe_id, tags(id, uid, name, category)')
      .in('recipe_id', ids),
    supabase
      .from('related_recipes')
      .select('recipe_id, position, recipes!related_recipe_id(id, uid, title)')
      .in('recipe_id', ids)
      .order('position'),
  ]);

  return recipeRows.map((recipe) => {
    const rid = recipe.id;

    const ings = (ingredients as IngredientRow[] | null ?? []).filter(
      (i) => i.recipe_id === rid,
    );
    const insts = (instructions as InstructionRow[] | null ?? []).filter(
      (i) => i.recipe_id === rid,
    );
    const tags = (recipeTags as RecipeTagResult[] | null ?? [])
      .filter((rt) => rt.recipe_id === rid)
      .flatMap((rt) => rt.tags ?? []);

    const related = (relatedLinks as RelatedRecipeResult[] | null ?? [])
      .filter((r) => r.recipe_id === rid)
      .sort((a, b) => a.position - b.position)
      .flatMap((r) => r.recipes ?? []);

    return {
      id: recipe.id,
      uid: recipe.uid,
      title: recipe.title,
      prep_minutes: recipe.prep_minutes ?? undefined,
      total_minutes: recipe.total_minutes ?? undefined,
      servings: recipe.servings ?? undefined,
      notes: recipe.notes ?? undefined,
      source: recipe.source ?? undefined,
      weekday: recipe.weekday,
      status: recipe.status ?? 'published',
      import_source: recipe.import_source ?? undefined,
      ingredients: ings.map(mapIngredient),
      instructions: insts.map(mapInstruction),
      cuisine_tags: tags.filter((t) => t.category === 'cuisine').map(mapTag),
      ingredient_tags: tags.filter((t) => t.category === 'ingredient').map(mapTag),
      type_tags: tags.filter((t) => t.category === 'type').map(mapTag),
      season_tags: tags.filter((t) => t.category === 'season').map(mapTag),
      related_recipes: related,
    };
  });
}

// ---------------------------------------------------------------------------
// Recipe queries
// ---------------------------------------------------------------------------

// T015 — return type narrowed from Recipe[] → RecipeSummary[]; callers only use uid/title
export async function getAllRecipes(): Promise<RecipeSummary[]> {
  try {
    const { data, error } = await createClient()
      .from('recipes')
      .select('id, uid, title')
      .eq('status', 'published');
    if (error) return [];
    return (data as RecipeSummary[]) ?? [];
  } catch {
    return [];
  }
}

export async function getRecipeByUid(uid: string): Promise<Recipe | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('recipes')
      .select('id, uid, title, prep_minutes, total_minutes, servings, notes, source, weekday, status, import_source')
      .eq('uid', uid)
      .single();
    if (error || !data) return null;
    const [recipe] = await hydrateRecipes(supabase, [data as RecipeRow]);
    return recipe ?? null;
  } catch {
    return null;
  }
}

export async function searchRecipes(term: string): Promise<RecipeSummary[]> {
  if (!term) return [];
  try {
    const { data, error } = await createClient()
      .from('recipes')
      .select('id, uid, title')
      .eq('status', 'published')
      .textSearch('title_fts', term);
    if (error) return [];
    return (data as RecipeSummary[]) ?? [];
  } catch {
    return [];
  }
}

export async function getWeekdayRecipes(): Promise<RecipeSummary[]> {
  try {
    const { data, error } = await createClient()
      .from('recipes')
      .select('id, uid, title')
      .eq('status', 'published')
      .eq('weekday', true);
    if (error) return [];
    return (data as RecipeSummary[]) ?? [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Tag list queries
// ---------------------------------------------------------------------------

export async function getCuisineTags(): Promise<Tag[]> {
  try {
    const { data, error } = await createClient()
      .from('tags')
      .select('id, uid, name, category')
      .eq('category', 'cuisine')
      .order('name');
    if (error) return [];
    return (data as TagRow[] ?? []).map(mapTag);
  } catch {
    return [];
  }
}

export async function getIngredientTags(): Promise<Tag[]> {
  try {
    const { data, error } = await createClient()
      .from('tags')
      .select('id, uid, name, category')
      .eq('category', 'ingredient')
      .order('name');
    if (error) return [];
    return (data as TagRow[] ?? []).map(mapTag);
  } catch {
    return [];
  }
}

export async function getTypeTags(): Promise<Tag[]> {
  try {
    const { data, error } = await createClient()
      .from('tags')
      .select('id, uid, name, category')
      .eq('category', 'type')
      .order('name');
    if (error) return [];
    return (data as TagRow[] ?? []).map(mapTag);
  } catch {
    return [];
  }
}

export async function getSeasonTags(): Promise<Tag[]> {
  try {
    const { data, error } = await createClient()
      .from('tags')
      .select('id, uid, name, category')
      .eq('category', 'season')
      .order('name');
    if (error) return [];
    return (data as TagRow[] ?? []).map(mapTag);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Tag lookup queries
// ---------------------------------------------------------------------------

async function getTagByUid(uid: string, category: string): Promise<Tag | null> {
  try {
    const { data, error } = await createClient()
      .from('tags')
      .select('id, uid, name, category')
      .eq('uid', uid)
      .eq('category', category)
      .single();
    if (error || !data) return null;
    return mapTag(data as TagRow);
  } catch {
    return null;
  }
}

export async function getCuisineTagByUid(uid: string): Promise<Tag | null> {
  return getTagByUid(uid, 'cuisine');
}

export async function getIngredientTagByUid(uid: string): Promise<Tag | null> {
  return getTagByUid(uid, 'ingredient');
}

export async function getTypeTagByUid(uid: string): Promise<Tag | null> {
  return getTagByUid(uid, 'type');
}

export async function getSeasonTagByUid(uid: string): Promise<Tag | null> {
  return getTagByUid(uid, 'season');
}

// ---------------------------------------------------------------------------
// Tag → recipe queries
// ---------------------------------------------------------------------------

async function getRecipesByTag(tagUid: string, category: string): Promise<RecipeSummary[]> {
  try {
    const supabase = createClient();
    const { data: tag, error: tagError } = await supabase
      .from('tags')
      .select('id')
      .eq('uid', tagUid)
      .eq('category', category)
      .single();
    if (tagError || !tag) return [];

    const { data, error } = await supabase
      .from('recipe_tags')
      .select('recipes(id, uid, title)')
      .eq('tag_id', (tag as { id: string }).id);
    if (error) return [];
    // Supabase returns recipes as array here; flatten + de-null
    return (data as unknown as TagRecipeResult[])
      .flatMap((row) => row.recipes ?? []);
  } catch {
    return [];
  }
}

export async function getRecipesByCuisineTag(uid: string): Promise<RecipeSummary[]> {
  return getRecipesByTag(uid, 'cuisine');
}

export async function getRecipesByIngredientTag(uid: string): Promise<RecipeSummary[]> {
  return getRecipesByTag(uid, 'ingredient');
}

export async function getRecipesByTypeTag(uid: string): Promise<RecipeSummary[]> {
  return getRecipesByTag(uid, 'type');
}

export async function getRecipesBySeasonTag(uid: string): Promise<RecipeSummary[]> {
  return getRecipesByTag(uid, 'season');
}

// ---------------------------------------------------------------------------
// Homepage curations
// ---------------------------------------------------------------------------

export async function getNextRecipes(): Promise<RecipeSummary[]> {
  try {
    const { data, error } = await createClient()
      .from('cook_next_list')
      .select('position, recipes(id, uid, title)')
      .order('position');
    if (error) return [];
    return (data as CurationResult[] | null ?? [])
      .flatMap((row) => row.recipes ?? []);
  } catch {
    return [];
  }
}

export async function getFavoriteRecipes(): Promise<RecipeSummary[]> {
  try {
    const { data, error } = await createClient()
      .from('favorites_list')
      .select('position, recipes(id, uid, title)')
      .order('position');
    if (error) return [];
    return (data as CurationResult[] | null ?? [])
      .flatMap((row) => row.recipes ?? []);
  } catch {
    return [];
  }
}

export async function getRecentRecipes(): Promise<RecipeSummary[]> {
  try {
    const { data, error } = await createClient()
      .from('recipes')
      .select('id, uid, title')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) return [];
    return (data as RecipeSummary[]) ?? [];
  } catch {
    return [];
  }
}

export async function getRandomRecipes(): Promise<RecipeSummary[]> {
  try {
    // Fetch all and shuffle client-side — acceptable at < 500 recipes
    const { data, error } = await createClient()
      .from('recipes')
      .select('id, uid, title')
      .eq('status', 'published');
    if (error || !data) return [];
    const shuffled = [...(data as RecipeSummary[])].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 10);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Grocery list  (T035)
// ---------------------------------------------------------------------------

export async function getCookNextRecipes(): Promise<Recipe[]> {
  try {
    const supabase = createClient();

    const { data: list, error: listError } = await supabase
      .from('cook_next_list')
      .select('position, recipe_id')
      .order('position');
    if (listError || !list || list.length === 0) return [];

    const ids = list.map((item) => item.recipe_id);

    const { data: recipeRows, error: recipeError } = await supabase
      .from('recipes')
      .select('id, uid, title, prep_minutes, total_minutes, servings, notes, source, weekday, status, import_source')
      .in('id', ids);
    if (recipeError || !recipeRows) return [];

    // Re-order to match cook_next_list.position order
    const ordered = ids
      .map((id) => (recipeRows as RecipeRow[]).find((r) => r.id === id))
      .filter((r): r is RecipeRow => r !== undefined);

    return hydrateRecipes(supabase, ordered);
  } catch {
    return [];
  }
}
