/* eslint-disable @typescript-eslint/no-explicit-any */

/* One-time migration: Prismic CMS → Supabase
//
// Usage (from repo root):
//   PRISMIC_API_URL=... PRISMIC_ACCESS_TOKEN=... npx tsx 2026-recipe-website/scripts/migrate-from-prismic.ts
//
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local (Supabase Dashboard → Project Settings → API)
// Requires NEXT_PUBLIC_SUPABASE_URL in .env.local

import { config as loadEnv } from 'dotenv';
import path from 'path';

// Load .env.local before clients are initialised — covers both repo-root and 2026-site cwd
loadEnv({ path: path.resolve(process.cwd(), '2026-recipe-website', '.env.local') });
loadEnv({ path: path.resolve(process.cwd(), '.env.local') });

import * as prismic from '@prismicio/client';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Env-var validation
// ---------------------------------------------------------------------------
const PRISMIC_API_URL = process.env.PRISMIC_API_URL;
const PRISMIC_ACCESS_TOKEN = process.env.PRISMIC_ACCESS_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!PRISMIC_API_URL) {
  console.error('Error: PRISMIC_API_URL is required');
  process.exit(1);
}
if (!SUPABASE_URL) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL is required (check .env.local)');
  process.exit(1);
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is required (check .env.local)');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Client setup
// ---------------------------------------------------------------------------
const prismicClient = prismic.createClient(PRISMIC_API_URL, {
  accessToken: PRISMIC_ACCESS_TOKEN,
});

// Service-role client bypasses RLS — required for admin writes
const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ---------------------------------------------------------------------------
// FK-resolution maps (populated during migration, used in later passes)
// ---------------------------------------------------------------------------
const tagUidToId: Record<string, string> = {};
const recipeUidToId: Record<string, string> = {};

// ---------------------------------------------------------------------------
// Helper types
// ---------------------------------------------------------------------------
type PrismicSpan = {
  type: string;
  start: number;
  end: number;
  data?: { url?: string };
};

const VALID_AISLES = new Set([
  'Beer and Wine', 'Produce', 'Deli', 'Bread', 'Seafood', 'Meat',
  'Cheese', 'World Aisle', 'Pasta', 'Condiments', 'Soups & Canned Goods',
  'Spices', 'Baking', 'Cereal', 'Chips', 'Soda', 'Frozen', 'Dairy',
]);

function sanitizeAisle(value: unknown): string | null {
  if (typeof value === 'string' && VALID_AISLES.has(value)) return value;
  if (value && typeof value === 'string') {
    console.warn(`    Unknown aisle value "${value}" → stored as null`);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Helper: convert Prismic RichTextField to markdown, preserving bold as **...**
// Required by InstructionSliceRenderer's withBold() parser in the 2026 site.
// ---------------------------------------------------------------------------
function richTextToBoldMarkdown(richText: prismic.RichTextField): string {
  if (!richText || richText.length === 0) return '';
  return richText
    .map((block) => {
      if (!('text' in block) || typeof block.text !== 'string') return '';
      const boldSpans = (('spans' in block ? block.spans as unknown as PrismicSpan[] : null) ?? [])
        .filter((s) => s.type === 'strong')
        .sort((a, b) => b.start - a.start); // reverse to preserve char positions

      let result = block.text;
      for (const span of boldSpans) {
        result =
          result.slice(0, span.start) +
          '**' +
          result.slice(span.start, span.end) +
          '**' +
          result.slice(span.end);
      }
      return result;
    })
    .filter(Boolean)
    .join('\n\n');
}

// ---------------------------------------------------------------------------
// Helper: parse an ingredient StructuredText field.
// Exactly one bold span → split into amount / name / preparation.
// Zero or multiple bold spans → full text in name.
// ---------------------------------------------------------------------------
function parseIngredient(field: prismic.RichTextField): {
  amount: string | null;
  name: string;
  preparation: string | null;
} {
  if (!field || field.length === 0) return { amount: null, name: '', preparation: null };

  const block = field[0] as any;
  const blockText: string = block.text ?? '';
  const boldSpans = ((block.spans as PrismicSpan[] | undefined) ?? []).filter(
    (s) => s.type === 'strong',
  );

  if (boldSpans.length === 1) {
    const span = boldSpans[0];
    const amount = blockText.slice(0, span.start).trim() || null;
    const name = blockText.slice(span.start, span.end);
    const prep = blockText.slice(span.end).replace(/^[,\s]+/, '').trim();
    return { amount, name, preparation: prep || null };
  }

  return { amount: null, name: prismic.asText(field), preparation: null };
}

// ---------------------------------------------------------------------------
// Helper: parse source RichText field — may contain a hyperlink span.
// If a hyperlink is found: store as [text](url) markdown.
// Otherwise: plain text.
// ---------------------------------------------------------------------------
function parseSource(field: prismic.RichTextField): string | null {
  const plainText = prismic.asText(field);
  if (!plainText) return null;

  const block = field?.[0] as any;
  const hyperlinkSpan = ((block?.spans as PrismicSpan[] | undefined) ?? []).find(
    (s) => s.type === 'hyperlink',
  );

  if (hyperlinkSpan?.data?.url) {
    return `[${plainText}](${hyperlinkSpan.data.url})`;
  }

  return plainText;
}

// ---------------------------------------------------------------------------
// Helper: insert rows in chunks and throw on error
// ---------------------------------------------------------------------------
async function insertChunked<T extends object>(
  table: string,
  rows: T[],
  chunkSize = 500,
): Promise<void> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await (supabase as any).from(table).insert(chunk);
    if (error) throw new Error(`Insert into ${table} failed: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  // =========================================================================
  // Step 0: Truncate all tables in FK-safe dependency order
  // =========================================================================
  console.log('\n--- Truncating tables ---');

  // Tables with recipe_id column (use as not-null filter to match all rows)
  const recipePkTables = ['favorites_list', 'cook_next_list', 'related_recipes', 'recipe_tags'];
  for (const table of recipePkTables) {
    const { error } = await (supabase as any)
      .from(table)
      .delete()
      .not('recipe_id', 'is', null);
    if (error) console.warn(`  Warning clearing ${table}: ${error.message}`);
  }

  // Tables with id column
  for (const table of ['ingredient_entries', 'instruction_entries', 'recipes', 'tags']) {
    const { error } = await (supabase as any).from(table).delete().not('id', 'is', null);
    if (error) console.warn(`  Warning clearing ${table}: ${error.message}`);
  }

  console.log('  Tables cleared.\n');

  // =========================================================================
  // Step 1: Migrate tags  (T007)
  // =========================================================================
  console.log('--- Migrating tags ---');

  const tagTypes = [
    { prismicType: 'ingredient_tag', category: 'ingredient', dataField: 'ingredient_tag' },
    { prismicType: 'cuisine_tag',    category: 'cuisine',    dataField: 'cuisine_tag'    },
    { prismicType: 'type_tag',       category: 'type',       dataField: 'type_tag'       },
    { prismicType: 'season_tag',     category: 'season',     dataField: 'season_tag'     },
  ] as const;

  for (const { prismicType, category, dataField } of tagTypes) {
    const docs = await prismicClient.getAllByType(prismicType);
    if (docs.length === 0) {
      console.log(`  ${category}: 0 tags`);
      continue;
    }

    const rows = docs.map((doc) => ({
      uid:      doc.uid!,
      name:     (doc.data as Record<string, string>)[dataField],
      category,
    }));

    const { data, error } = await (supabase as any)
      .from('tags')
      .insert(rows)
      .select('id, uid');
    if (error) throw new Error(`Failed to insert ${category} tags: ${error.message}`);

    for (const row of data as { id: string; uid: string }[]) {
      tagUidToId[row.uid] = row.id;
    }
    console.log(`  ${category}: ${rows.length} tags`);
  }

  // =========================================================================
  // Step 2: Fetch all recipes from Prismic  (T008)
  // =========================================================================
  console.log('\n--- Fetching recipes from Prismic ---');

  const allRecipes = await prismicClient.getAllByType('recipe', {
    fetchLinks: ['recipe.uid', 'recipe.title'],
  });

  console.log(`  Found ${allRecipes.length} recipes.`);

  // =========================================================================
  // Step 3: Insert recipe rows (pass 1 — related_recipes come in pass 2)  (T008)
  // =========================================================================
  console.log('\n--- Migrating recipe rows (pass 1) ---');

  const recipeRows = allRecipes.map((doc) => {
    const d = doc.data as any;
    return {
      uid:           doc.uid!,
      title:         prismic.asText(d.title),
      prep_minutes:  d.minutes_prep ?? null,
      total_minutes: d.minutes_total ?? null,
      servings:      d.servings ?? null,
      notes:         prismic.asText(d.recipe_notes) || null,
      source:        parseSource(d.source),
      // Legacy Select field: 'Yes' = true, all else = false
      weekday:       d.weekday_tag === 'Yes',
      // Must be set explicitly — column has no DEFAULT; drives getRecentRecipes() ordering
      created_at:    doc.first_publication_date,
    };
  });

  const { data: insertedRecipes, error: recipeError } = await (supabase as any)
    .from('recipes')
    .insert(recipeRows)
    .select('id, uid');
  if (recipeError) throw new Error(`Failed to insert recipes: ${recipeError.message}`);

  for (const row of insertedRecipes as { id: string; uid: string }[]) {
    recipeUidToId[row.uid] = row.id;
  }
  console.log(`  Inserted ${allRecipes.length} recipe rows.`);

  // =========================================================================
  // Step 4: Migrate ingredient entries  (T009)
  // =========================================================================
  console.log('\n--- Migrating ingredient entries ---');

  const ingredientRows: object[] = [];

  for (const doc of allRecipes) {
    const d = doc.data as any;
    const recipeId = recipeUidToId[doc.uid!];
    const slices: Array<{ slice_type: string; primary: any }> = d.ingredient_slices ?? [];

    for (let position = 0; position < slices.length; position++) {
      const slice = slices[position];
      if (slice.slice_type === 'ingredient_heading') {
        ingredientRows.push({
          recipe_id:   recipeId,
          position,
          type:        'heading',
          name:        prismic.asText(slice.primary.ingredient_heading),
          amount:      null,
          preparation: null,
          aisle:       null,
        });
      } else {
        // ingredient slice
        const { amount, name, preparation } = parseIngredient(slice.primary.ingredient);
        ingredientRows.push({
          recipe_id:   recipeId,
          position,
          type:        'ingredient',
          name,
          amount,
          preparation,
          aisle:       sanitizeAisle(slice.primary.aisle),
        });
      }
    }
  }

  await insertChunked('ingredient_entries', ingredientRows);
  console.log(`  Inserted ${ingredientRows.length} ingredient entries.`);

  // =========================================================================
  // Step 5: Migrate instruction entries  (T010)
  // =========================================================================
  console.log('\n--- Migrating instruction entries ---');

  const instructionRows: object[] = [];

  for (const doc of allRecipes) {
    const d = doc.data as any;
    const recipeId = recipeUidToId[doc.uid!];
    const slices: Array<{ slice_type: string; primary: any }> = d.body ?? [];

    for (let position = 0; position < slices.length; position++) {
      const slice = slices[position];
      if (slice.slice_type === 'instruction_heading') {
        instructionRows.push({
          recipe_id: recipeId,
          position,
          type:      'heading',
          text:      prismic.asText(slice.primary.instruction_heading),
        });
      } else {
        // recipe_instruction: convert bold spans to **markdown**
        instructionRows.push({
          recipe_id: recipeId,
          position,
          type:      'instruction',
          text:      richTextToBoldMarkdown(slice.primary.instruction),
        });
      }
    }
  }

  await insertChunked('instruction_entries', instructionRows);
  console.log(`  Inserted ${instructionRows.length} instruction entries.`);

  // =========================================================================
  // Step 6: Migrate recipe_tags  (T011)
  // =========================================================================
  console.log('\n--- Migrating recipe tags ---');

  const tagLinkField: Record<string, string> = {
    main_ingredient_tags: 'ingredient_tag',
    cuisine_tags:         'cuisine_tag',
    type_tags:            'type_tag',
    season_tags:          'season_tag',
  };

  const recipeTagRows: object[] = [];

  for (const doc of allRecipes) {
    const d = doc.data as any;
    const recipeId = recipeUidToId[doc.uid!];

    for (const [groupField, linkField] of Object.entries(tagLinkField)) {
      const tagArray: any[] = d[groupField] ?? [];
      for (const item of tagArray) {
        const linkedDoc = item[linkField];
        if (!linkedDoc || linkedDoc.isBroken) continue;
        const tagId = tagUidToId[linkedDoc.uid];
        if (tagId) {
          recipeTagRows.push({ recipe_id: recipeId, tag_id: tagId });
        }
      }
    }
  }

  await insertChunked('recipe_tags', recipeTagRows);
  console.log(`  Inserted ${recipeTagRows.length} recipe-tag associations.`);

  // =========================================================================
  // Step 7: Migrate related_recipes (pass 2 — all recipe IDs now exist)  (T012)
  // =========================================================================
  console.log('\n--- Migrating related recipes (pass 2) ---');

  const relatedRows: object[] = [];

  for (const doc of allRecipes) {
    const d = doc.data as any;
    const recipeId = recipeUidToId[doc.uid!];
    const relatedArray: any[] = d.related_recipes ?? [];

    for (let position = 0; position < relatedArray.length; position++) {
      const linkedDoc = relatedArray[position].related_recipe;
      if (!linkedDoc || linkedDoc.isBroken) continue;
      const relatedId = recipeUidToId[linkedDoc.uid];
      if (relatedId) {
        relatedRows.push({ recipe_id: recipeId, related_recipe_id: relatedId, position });
      }
    }
  }

  await insertChunked('related_recipes', relatedRows);
  console.log(`  Inserted ${relatedRows.length} related-recipe links.`);

  // =========================================================================
  // Step 8: Migrate curated lists  (T013)
  // =========================================================================
  console.log('\n--- Migrating curated lists ---');

  // Cook Next List
  const cookNextDocs = await prismicClient.getAllByType('cook_next_list', {
    fetchLinks: ['recipe.uid'],
  });

  let cookNextCount = 0;
  if (cookNextDocs.length > 0) {
    const cookNextData = cookNextDocs[0].data as any;
    const nextRows: object[] = [];

    for (let position = 0; position < (cookNextData.next_recipes ?? []).length; position++) {
      const linkedDoc = cookNextData.next_recipes[position].next_recipe;
      if (!linkedDoc || linkedDoc.isBroken) continue;
      const recipeId = recipeUidToId[linkedDoc.uid];
      if (recipeId) nextRows.push({ recipe_id: recipeId, position });
    }

    if (nextRows.length > 0) {
      const { error } = await (supabase as any).from('cook_next_list').insert(nextRows);
      if (error) throw new Error(`Failed to insert cook_next_list: ${error.message}`);
    }
    cookNextCount = nextRows.length;
  }

  // Favorites List
  const favoriteDocs = await prismicClient.getAllByType('favorites_list', {
    fetchLinks: ['recipe.uid'],
  });

  let favoritesCount = 0;
  if (favoriteDocs.length > 0) {
    const favoriteData = favoriteDocs[0].data as any;
    const favoriteRows: object[] = [];

    for (let position = 0; position < (favoriteData.favorite_recipes ?? []).length; position++) {
      const linkedDoc = favoriteData.favorite_recipes[position].favorite_recipe;
      if (!linkedDoc || linkedDoc.isBroken) continue;
      const recipeId = recipeUidToId[linkedDoc.uid];
      if (recipeId) favoriteRows.push({ recipe_id: recipeId, position });
    }

    if (favoriteRows.length > 0) {
      const { error } = await (supabase as any).from('favorites_list').insert(favoriteRows);
      if (error) throw new Error(`Failed to insert favorites_list: ${error.message}`);
    }
    favoritesCount = favoriteRows.length;
  }

  // =========================================================================
  // Step 9: Count summary for manual verification  (T013)
  // =========================================================================
  console.log('\n--- Migration Summary ---');

  const { count: recipeCount } = await (supabase as any)
    .from('recipes')
    .select('*', { count: 'exact', head: true });

  const { data: tagData } = await (supabase as any).from('tags').select('category');
  const tagCountsByCategory: Record<string, number> = {};
  for (const tag of (tagData ?? []) as { category: string }[]) {
    tagCountsByCategory[tag.category] = (tagCountsByCategory[tag.category] ?? 0) + 1;
  }

  console.log(`  Recipes:             ${recipeCount}`);
  console.log(`  Tags (ingredient):   ${tagCountsByCategory.ingredient ?? 0}`);
  console.log(`  Tags (cuisine):      ${tagCountsByCategory.cuisine ?? 0}`);
  console.log(`  Tags (type):         ${tagCountsByCategory.type ?? 0}`);
  console.log(`  Tags (season):       ${tagCountsByCategory.season ?? 0}`);
  console.log(`  Cook Next List:      ${cookNextCount}`);
  console.log(`  Favorites List:      ${favoritesCount}`);
  console.log('\nMigration complete! Spot-check recipes in the Supabase table editor.');
}

main().catch((err) => {
  console.error('\nMigration failed:', err.message ?? err);
  process.exit(1);
});
*/
