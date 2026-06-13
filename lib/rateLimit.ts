type FixedRateLimitRecord = {
  count: number;
  resetAt: number;
};

const fixedStore = new Map<string, FixedRateLimitRecord>();
const slidingStore = new Map<string, number[]>();

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() ?? 'unknown';
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export function rateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const existing = fixedStore.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    fixedStore.set(key, { count: 1, resetAt });
    return {
      ok: true,
      limit,
      remaining: limit - 1,
      resetAt
    };
  }

  existing.count += 1;
  fixedStore.set(key, existing);

  return {
    ok: existing.count <= limit,
    limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt
  };
}

export function slidingWindowRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const windowStart = now - windowMs;
  const hits = (slidingStore.get(key) ?? []).filter((timestamp) => timestamp > windowStart);
  const ok = hits.length < limit;

  if (ok) hits.push(now);

  if (hits.length > 0) slidingStore.set(key, hits);
  else slidingStore.delete(key);

  const oldest = hits[0] ?? now;
  const resetAt = oldest + windowMs;

  return {
    ok,
    limit,
    remaining: ok ? Math.max(0, limit - hits.length) : 0,
    resetAt
  };
}

export function rateLimitHeaders(result: ReturnType<typeof rateLimit> | ReturnType<typeof slidingWindowRateLimit>) {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000))
  };
}
