export interface RecipeSummary {
  id: string;
  uid: string;
  title: string;
}

export interface Tag {
  id: string;
  uid: string;
  name: string;
}

export interface IngredientSlice {
  type: 'heading' | 'ingredient';
  amount?: string;
  name: string;
  preparation?: string;
  aisle?: string;
}

export interface InstructionSlice {
  type: 'heading' | 'instruction';
  text: string;
}

export interface GroceryIngredient {
  id: string;
  text: string;
  aisle: string;
  isDuplicate?: boolean;
  recipeTitle?: string;
  recipeUid?: string;
}

export interface Recipe extends RecipeSummary {
  hero_image_url?: string;
  prep_minutes?: number;
  total_minutes?: number;
  servings?: number;
  notes?: string;
  source?: string;
  weekday: boolean;
  ingredients: IngredientSlice[];
  instructions: InstructionSlice[];
  cuisine_tags: Tag[];
  ingredient_tags: Tag[];
  type_tags: Tag[];
  season_tags: Tag[];
  related_recipes: RecipeSummary[];
}
