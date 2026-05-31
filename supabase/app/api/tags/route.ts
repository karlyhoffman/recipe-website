import { createClient } from '@/lib/supabase';

export interface TagOption {
  id: string;
  uid: string;
  name: string;
  category: 'cuisine' | 'type' | 'season' | 'ingredient';
}

export async function GET() {
  const { data, error } = await createClient()
    .from('tags')
    .select('id, uid, name, category')
    .order('category')
    .order('name');

  if (error) {
    return Response.json({ error: 'Failed to fetch tags.' }, { status: 500 });
  }

  return Response.json(data ?? []);
}
