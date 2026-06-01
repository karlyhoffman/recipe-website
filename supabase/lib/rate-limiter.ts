interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const MAX_ATTEMPTS = 5;
const GLOBAL_MAX_ATTEMPTS = 25;
const WINDOW_MS = 15 * 60 * 1000;

const ipAttempts = new Map<string, RateLimitEntry>();
let globalEntry: RateLimitEntry | null = null;

export function isRateLimited(ip: string): boolean {
  const now = Date.now();

  if (globalEntry) {
    if (now - globalEntry.windowStart >= WINDOW_MS) {
      globalEntry = null;
    } else if (globalEntry.count >= GLOBAL_MAX_ATTEMPTS) {
      return true;
    }
  }

  const entry = ipAttempts.get(ip);
  if (!entry) return false;
  if (now - entry.windowStart >= WINDOW_MS) {
    ipAttempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

export function recordFailedAttempt(ip: string): void {
  const now = Date.now();

  if (!globalEntry || now - globalEntry.windowStart >= WINDOW_MS) {
    globalEntry = { count: 1, windowStart: now };
  } else {
    globalEntry.count++;
  }

  const entry = ipAttempts.get(ip);
  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    ipAttempts.set(ip, { count: 1, windowStart: now });
  } else {
    entry.count++;
  }
}

export function clearAttempts(ip: string): void {
  ipAttempts.delete(ip);
  globalEntry = null;
}
