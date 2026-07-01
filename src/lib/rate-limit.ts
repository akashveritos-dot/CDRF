interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const cache = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.resetTime) {
      cache.delete(key);
    }
  }
  lastCleanup = now;
}

export function rateLimit(ip: string, limit = 60, windowMs = 60000): { isLimited: boolean; current: number; limit: number; reset: number } {
  const now = Date.now();

  // Clean up cache periodically (every 5 minutes) or if it grows too large
  if (now - lastCleanup > 300000 || cache.size > 5000) {
    cleanup();
  }

  const entry = cache.get(ip);

  if (!entry) {
    const resetTime = now + windowMs;
    cache.set(ip, { count: 1, resetTime });
    return { isLimited: false, current: 1, limit, reset: resetTime };
  }

  if (now > entry.resetTime) {
    const resetTime = now + windowMs;
    entry.count = 1;
    entry.resetTime = resetTime;
    return { isLimited: false, current: 1, limit, reset: resetTime };
  }

  entry.count += 1;
  return {
    isLimited: entry.count > limit,
    current: entry.count,
    limit,
    reset: entry.resetTime
  };
}
