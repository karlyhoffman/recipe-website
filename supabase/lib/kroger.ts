const TOKEN_URL = 'https://api.kroger.com/v1/connect/oauth2/token';
const PRODUCTS_URL = 'https://api.kroger.com/v1/products';
const SCOPE = 'product.compact';
const FETCH_TIMEOUT_MS = 10_000;

export interface KrogerProductMatch {
  price: number;
  size: string;
  unit: string;
}

export async function getAccessToken(): Promise<string> {
  const clientId = process.env.KROGER_CLIENT_ID;
  const clientSecret = process.env.KROGER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('Missing KROGER_CLIENT_ID or KROGER_CLIENT_SECRET');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=client_credentials&scope=${SCOPE}`,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!res.ok) {
    // Log the body server-side for debugging, but throw a sanitized message
    // so the OAuth error detail doesn't reach the browser via the Server Action response.
    const body = await res.text().catch(() => '');
    console.error(`Kroger token request failed: ${res.status}`, body);
    throw new Error(`Kroger token request failed: ${res.status}`);
  }

  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new Error('Kroger token response missing access_token');
  }
  return json.access_token;
}

type KrogerProductItem = {
  price?: { regular?: number; promo?: number };
  size?: string;
  inventory?: { stockLevel?: string };
};

type KrogerProduct = {
  productId: string;
  description?: string;
  items?: KrogerProductItem[];
};

type KrogerProductsResponse = {
  data?: KrogerProduct[];
};

export async function searchProduct(
  token: string,
  locationId: string,
  term: string,
): Promise<KrogerProductMatch | null> {
  const params = new URLSearchParams({
    'filter.term': term,
    'filter.locationId': locationId,
    'filter.limit': '5',
  });
  const res = await fetch(`${PRODUCTS_URL}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Kroger product search failed (${term}): ${res.status}`);
  }

  const json = (await res.json()) as KrogerProductsResponse;
  const products = json.data ?? [];

  let best: KrogerProductMatch | null = null;
  for (const product of products) {
    for (const item of product.items ?? []) {
      // Allowlist known in-stock levels rather than denylisting one out-of-stock
      // string. Missing inventory or unknown stock levels are treated as
      // unavailable (FR-006 collapses unmatched + out-of-stock to the same UI label).
      const stockLevel = item.inventory?.stockLevel?.toUpperCase();
      if (stockLevel !== 'HIGH' && stockLevel !== 'LOW') continue;

      const price = item.price?.promo && item.price.promo > 0
        ? item.price.promo
        : item.price?.regular;
      if (typeof price !== 'number' || price <= 0) continue;

      const size = item.size ?? '';
      const unit = parseUnit(size);

      if (best === null || price < best.price) {
        best = { price, size, unit };
      }
    }
  }

  return best;
}

function parseUnit(size: string): string {
  if (!size) return 'each';
  // Capture every trailing token made of letters and spaces — preserves
  // multi-word units like "fl oz" or "ct each" instead of just "oz" / "each".
  const match = size.match(/[a-zA-Z][a-zA-Z\s]*$/);
  if (!match) return 'each';
  return match[0].trim().replace(/\s+/g, ' ').toLowerCase();
}
