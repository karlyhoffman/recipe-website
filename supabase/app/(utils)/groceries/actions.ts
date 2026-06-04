'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { verifyToken } from '@/lib/session';
import { syncPrices } from '@/lib/sync-prices';

export interface RefreshPricesActionResult {
  ok: boolean;
  error?: string;
  summary?: { storesUpdated: number; rowsUpserted: number; errorCount: number };
}

export async function refreshPricesAction(): Promise<RefreshPricesActionResult> {
  // Verify the JWT cookie directly rather than reading the x-user-authenticated
  // header set by the proxy. The header is overwritten by proxy.ts on every
  // matched request, so it cannot currently be spoofed end-to-end — but
  // depending on the proxy contract from inside a Server Action makes this
  // check trivially fail-open if the matcher ever changes. Cookie verification
  // is independent of header state.
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token || !(await verifyToken(token))) {
    return { ok: false, error: 'unauthenticated' };
  }

  try {
    const { storesUpdated, rowsUpserted, errors } = await syncPrices();
    revalidatePath('/groceries');
    if (errors.length > 0) {
      console.error(`refreshPricesAction: ${errors.length} per-ingredient errors`, errors);
    }
    return {
      ok: true,
      summary: { storesUpdated, rowsUpserted, errorCount: errors.length },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed';
    return { ok: false, error: message };
  }
}
