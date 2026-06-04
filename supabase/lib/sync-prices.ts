import { createServiceRoleClient } from '@/lib/supabase';
import { getAccessToken, searchProduct } from '@/lib/kroger';

export const CANONICAL_INGREDIENTS = [
  'eggs', 'butter', 'flour', 'milk', 'sugar', 'salt',
  'olive oil', 'garlic', 'onion', 'chicken', 'beef',
  'pasta', 'rice', 'tomato', 'lemon',
] as const;

type ActiveStoreRow = {
  id: string;
  name: string;
  kroger_location_id: string;
};

export interface SyncResult {
  storesUpdated: number;
  rowsUpserted: number;
  errors: string[];
}

type PriceRow = {
  store_id: string;
  canonical_name: string;
  price: number;
  unit: string;
  in_stock: boolean;
};

export async function syncPrices(): Promise<SyncResult> {
  const supabase = createServiceRoleClient();
  const errors: string[] = [];

  const { data: storesData, error: storesError } = await supabase
    .from('stores')
    .select('id, name, kroger_location_id')
    .eq('is_active', true)
    .not('kroger_location_id', 'is', null);

  if (storesError) {
    throw new Error(`Failed to load stores: ${storesError.message}`);
  }
  // DB filter already excludes nulls; cast directly.
  const stores = (storesData ?? []) as ActiveStoreRow[];
  if (stores.length === 0) {
    return { storesUpdated: 0, rowsUpserted: 0, errors };
  }

  const token = await getAccessToken();

  // Fetch product matches for every (store, canonical) pair in parallel — one
  // sync run is bounded to ~stores × CANONICAL_INGREDIENTS calls, which is ~30
  // today. Sequential awaits previously made this the wall-clock bottleneck.
  const pairs = stores.flatMap((store) =>
    CANONICAL_INGREDIENTS.map((canonical) => ({ store, canonical })),
  );

  // Concurrency and retry/backoff to reduce Kroger rate-limit and network errors.
  const CONCURRENCY = Number(process.env.KROGER_SYNC_CONCURRENCY) || 5;
  const MAX_RETRIES = 2;
  const BACKOFF_BASE_MS = 500;

  function sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
  }

  const rows: (PriceRow | null)[] = [];
  for (let i = 0; i < pairs.length; i += CONCURRENCY) {
    const batch = pairs.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(async ({ store, canonical }): Promise<PriceRow | null> => {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const match = await searchProduct(token, store.kroger_location_id, canonical);
          return match
            ? { store_id: store.id, canonical_name: canonical, price: match.price, unit: match.unit, in_stock: true }
            : { store_id: store.id, canonical_name: canonical, price: 0, unit: 'each', in_stock: false };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (attempt < MAX_RETRIES) {
            const delay = BACKOFF_BASE_MS * Math.pow(2, attempt);
            await sleep(delay);
            continue;
          }
          errors.push(`${store.name}/${canonical}: ${message}`);
          return null;
        }
      }
      return null;
    }));
    rows.push(...batchResults);
  }

  const upsertRows = rows.filter((r): r is PriceRow => r !== null);
  if (upsertRows.length === 0) {
    return { storesUpdated: 0, rowsUpserted: 0, errors };
  }

  // Single batched upsert — replaces 30 individual round trips to Supabase.
  const { error: upsertError } = await supabase
    .from('ingredient_prices')
    .upsert(upsertRows, { onConflict: 'store_id,canonical_name' });

  if (upsertError) {
    errors.push(`Batch upsert failed: ${upsertError.message}`);
    return { storesUpdated: 0, rowsUpserted: 0, errors };
  }

  const storesWithUpdates = new Set(upsertRows.map((r) => r.store_id));
  return {
    storesUpdated: storesWithUpdates.size,
    rowsUpserted: upsertRows.length,
    errors,
  };
}
