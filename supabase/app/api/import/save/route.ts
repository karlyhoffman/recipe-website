import { createServiceRoleClient } from '@/lib/supabase';
import type { IngredientSlice, InstructionSlice } from '@/types';

function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'recipe';
}

async function findAvailableUid(
  supabase: ReturnType<typeof createServiceRoleClient>,
  base: string
): Promise<string> {
  const { data } = await supabase
    .from('recipes')
    .select('uid')
    .or(`uid.eq.${base},uid.like.${base}-%`);

  const existing = new Set((data ?? []).map((r: { uid: string }) => r.uid));
  if (!existing.has(base)) return base;

  let n = 2;
  while (existing.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export async function POST(request: Request) {
  const supabase = createServiceRoleClient();

  let body: {
    title?: string;
    ingredients?: IngredientSlice[];
    instructions?: InstructionSlice[];
    import_source?: string;
    prep_minutes?: number;
    total_minutes?: number;
    servings?: number;
    notes?: string;
    tag_ids?: string[];
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { title, ingredients = [], instructions = [], import_source = '', prep_minutes, total_minutes, servings, notes, tag_ids } = body;

  if (!title || !title.trim()) {
    return Response.json({ error: 'A recipe title is required before saving.' }, { status: 400 });
  }

  const base = slugify(title.trim());
  const uid = await findAvailableUid(supabase, base);
  const createdAt = new Date().toISOString();

  const { error } = await supabase.rpc('import_recipe', {
    p_uid: uid,
    p_title: title.trim(),
    p_status: 'draft',
    p_import_source: import_source || '',
    p_created_at: createdAt,
    p_ingredients: ingredients,
    p_instructions: instructions,
    p_prep_minutes: prep_minutes ?? null,
    p_total_minutes: total_minutes ?? null,
    p_servings: servings ?? null,
    p_notes: notes ?? null,
    p_tag_ids: tag_ids?.length ? tag_ids : null,
  });

  if (error) {
    console.error('[save] import_recipe RPC failed:', error.message, error.details, error.hint, error.code);
    return Response.json({ error: 'Failed to save recipe. Please try again.' }, { status: 500 });
  }

  return Response.json({ uid });
}
