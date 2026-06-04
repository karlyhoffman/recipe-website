import type {
  IngredientPrice,
  MatchedIngredient,
  PriceComparisonResult,
  Store,
  StoreComparisonEntry,
  UnmatchedIngredient,
} from '@/types';
import { createClient } from '@/lib/supabase';

const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

const COOKING_ADJECTIVES = new Set([
  'fresh', 'dried', 'frozen', 'organic', 'large', 'small', 'medium', 'extra',
  'whole', 'all-purpose', 'plain', 'unsalted', 'salted', 'boneless', 'skinless',
  'ground', 'minced', 'chopped', 'diced', 'sliced', 'grated', 'shredded',
]);

export function normalizeIngredientName(raw: string): string {
  let s = raw.toLowerCase().trim();

  // Strip trailing parenthetical notes, e.g. "(or substitute)"
  s = s.replace(/\s*\([^)]*\)\s*$/g, '').trim();

  // Strip leading amount tokens: numbers, fractions ("1/2"), unicode fractions, and
  // common unit words immediately after them ("cups", "tsp", etc).
  s = s.replace(/^[\d¼-¾⅐-⅞./\s-]+/, '').trim();

  const tokens = s.split(/\s+/).filter((t) => t.length > 0 && !COOKING_ADJECTIVES.has(t));
  s = tokens.join(' ').trim();

  // Pluralisation, applied in order
  if (s.endsWith('ies') && s.length > 3) {
    s = s.slice(0, -3) + 'y';
  } else if (s.endsWith('oes') && s.length > 3) {
    s = s.slice(0, -2);
  } else if (s.endsWith('s') && s.length > 3) {
    s = s.slice(0, -1);
  }

  return s;
}

type IngredientPriceRow = Omit<IngredientPrice, 'price'> & {
  price: string; // Postgres numeric is always serialized as a string by PostgREST.
};

function toPrice(row: IngredientPriceRow): IngredientPrice | null {
  const parsed = Number(row.price);
  if (!Number.isFinite(parsed)) return null;
  return { ...row, price: parsed };
}

export async function computePriceComparison(
  ingredientNames: string[],
): Promise<PriceComparisonResult> {
  const uniqueNames = Array.from(new Set(ingredientNames));
  const totalIngredients = uniqueNames.length;
  const unavailable: PriceComparisonResult = {
    entries: [],
    totalIngredients,
    isUnavailable: true,
  };

  try {
    const supabase = createClient();

    const { data: storesData, error: storesError } = await supabase
      .from('stores')
      .select('id, name, region, is_active, kroger_location_id')
      .eq('is_active', true);
    if (storesError || !storesData) return unavailable;

    const activeStores = storesData as Store[];
    if (activeStores.length === 0) return unavailable;

    const { data: priceData, error: priceError } = await supabase
      .from('ingredient_prices')
      .select('id, store_id, canonical_name, price, unit, in_stock, updated_at')
      .in('store_id', activeStores.map((s) => s.id));
    if (priceError || !priceData) return unavailable;

    const allPrices = (priceData as IngredientPriceRow[])
      .map(toPrice)
      .filter((p): p is IngredientPrice => p !== null);
    if (allPrices.length === 0) return unavailable;

    const pricesByStore = new Map<string, IngredientPrice[]>();
    for (const p of allPrices) {
      const list = pricesByStore.get(p.store_id);
      if (list) list.push(p);
      else pricesByStore.set(p.store_id, [p]);
    }

    const now = Date.now();
    const entries: StoreComparisonEntry[] = [];

    for (const store of activeStores) {
      const storePrices = pricesByStore.get(store.id);
      if (!storePrices || storePrices.length === 0) continue;

      const matched: MatchedIngredient[] = [];
      const unmatched: UnmatchedIngredient[] = [];

      for (const ingredientName of uniqueNames) {
        const normalized = normalizeIngredientName(ingredientName);
        // Pad with spaces so canonical must appear as a whole-word phrase —
        // prevents 'egg' from matching 'eggplant', 'rice' from matching 'licorice', etc.
        const paddedNormalized = ` ${normalized} `;

        let bestPrice: IngredientPrice | null = null;
        for (const price of storePrices) {
          if (!price.in_stock) continue;
          if (!paddedNormalized.includes(` ${price.canonical_name} `)) continue;
          if (bestPrice === null || price.price < bestPrice.price) {
            bestPrice = price;
          }
        }

        if (bestPrice) {
          matched.push({
            ingredientName,
            canonicalName: bestPrice.canonical_name,
            price: bestPrice.price,
            unit: bestPrice.unit,
          });
        } else {
          unmatched.push({ name: ingredientName, reason: 'no_match' });
        }
      }

      // A store that matches none of the user's ingredients shouldn't render
      // as a $0 entry ranked above stores that actually have matches; treat it
      // the same as a store with no price rows at all (skip + drives FR-009
      // unavailability when no store has any matches).
      if (matched.length === 0) continue;

      const totalCost = matched.reduce((sum, m) => sum + m.price, 0);
      const lastUpdatedMs = storePrices.reduce((max, p) => {
        const parsed = Date.parse(p.updated_at);
        const ts = Number.isFinite(parsed) ? parsed : 0;
        return Math.max(max, ts);
      }, 0);
      const lastUpdated = lastUpdatedMs > 0 ? new Date(lastUpdatedMs).toISOString() : '';
      const isStale = lastUpdatedMs === 0 || (now - lastUpdatedMs > STALE_AFTER_MS);

      entries.push({
        store,
        matchedIngredients: matched,
        unmatchedIngredients: unmatched,
        totalCost,
        matchedCount: matched.length,
        lastUpdated,
        isStale,
      });
    }

    entries.sort((a, b) => a.totalCost - b.totalCost);

    return {
      entries,
      totalIngredients,
      isUnavailable: entries.length === 0,
    };
  } catch {
    return unavailable;
  }
}
