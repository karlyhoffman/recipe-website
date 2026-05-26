import type { Recipe, RecipeSummary, Tag } from '@/types';
import {
  recipes,
  cuisineTags,
  ingredientTags,
  typeTags,
  seasonTags,
  nextRecipes,
  favoriteRecipes,
  recentRecipes,
  randomRecipes,
  cookNextRecipes,
} from '@/lib/placeholder-data';

// Recipe queries

export async function getAllRecipes(): Promise<Recipe[]> {
  return recipes;
}

export async function getRecipeByUid(uid: string): Promise<Recipe | null> {
  return recipes.find((r) => r.uid === uid) ?? null;
}

export async function searchRecipes(term: string): Promise<RecipeSummary[]> {
  if (!term) return [];
  const lower = term.toLowerCase();
  return recipes
    .filter((r) => r.title.toLowerCase().includes(lower))
    .map(({ id, uid, title }) => ({ id, uid, title }));
}

export async function getWeekdayRecipes(): Promise<RecipeSummary[]> {
  return recipes
    .filter((r) => r.weekday)
    .map(({ id, uid, title }) => ({ id, uid, title }));
}

// Tag list queries

export async function getCuisineTags(): Promise<Tag[]> {
  return cuisineTags;
}

export async function getIngredientTags(): Promise<Tag[]> {
  return ingredientTags;
}

export async function getTypeTags(): Promise<Tag[]> {
  return typeTags;
}

export async function getSeasonTags(): Promise<Tag[]> {
  return seasonTags;
}

// Tag lookup queries

export async function getCuisineTagByUid(uid: string): Promise<Tag | null> {
  return cuisineTags.find((t) => t.uid === uid) ?? null;
}

export async function getIngredientTagByUid(uid: string): Promise<Tag | null> {
  return ingredientTags.find((t) => t.uid === uid) ?? null;
}

export async function getTypeTagByUid(uid: string): Promise<Tag | null> {
  return typeTags.find((t) => t.uid === uid) ?? null;
}

export async function getSeasonTagByUid(uid: string): Promise<Tag | null> {
  return seasonTags.find((t) => t.uid === uid) ?? null;
}

// Tag → recipe queries

export async function getRecipesByCuisineTag(uid: string): Promise<RecipeSummary[]> {
  return recipes
    .filter((r) => r.cuisine_tags.some((t) => t.uid === uid))
    .map(({ id, uid: recipeUid, title }) => ({ id, uid: recipeUid, title }));
}

export async function getRecipesByIngredientTag(uid: string): Promise<RecipeSummary[]> {
  return recipes
    .filter((r) => r.ingredient_tags.some((t) => t.uid === uid))
    .map(({ id, uid: recipeUid, title }) => ({ id, uid: recipeUid, title }));
}

export async function getRecipesByTypeTag(uid: string): Promise<RecipeSummary[]> {
  return recipes
    .filter((r) => r.type_tags.some((t) => t.uid === uid))
    .map(({ id, uid: recipeUid, title }) => ({ id, uid: recipeUid, title }));
}

export async function getRecipesBySeasonTag(uid: string): Promise<RecipeSummary[]> {
  return recipes
    .filter((r) => r.season_tags.some((t) => t.uid === uid))
    .map(({ id, uid: recipeUid, title }) => ({ id, uid: recipeUid, title }));
}

// Homepage curations

export async function getNextRecipes(): Promise<RecipeSummary[]> {
  return nextRecipes;
}

export async function getFavoriteRecipes(): Promise<RecipeSummary[]> {
  return favoriteRecipes;
}

export async function getRecentRecipes(): Promise<RecipeSummary[]> {
  return recentRecipes;
}

export async function getRandomRecipes(): Promise<RecipeSummary[]> {
  return randomRecipes;
}

// Grocery list

export async function getCookNextRecipes(): Promise<Recipe[]> {
  return cookNextRecipes;
}
