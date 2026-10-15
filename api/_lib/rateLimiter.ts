interface Bucket {
  tokens: number
  lastRefill: number
}

// In-memory token bucket rate limiter for Vercel Serverless (best effort per instance)
const userBuckets = new Map<string, Bucket>()
const CAPACITY = 60
const REFILL_RATE_PER_MS = 60 / 60_000 // 1 token per second (60 tokens per minute)

/**
 * Checks rate limit for a specific user uid.
 * Returns true if request is permitted, false if rate limited.
 */
export function checkRateLimit(uid: string): boolean {
  const now = Date.now()
  let bucket = userBuckets.get(uid)

  if (!bucket) {
    bucket = { tokens: CAPACITY - 1, lastRefill: now }
    userBuckets.set(uid, bucket)
    return true
  }

  const elapsed = now - bucket.lastRefill
  const tokensToAdd = elapsed * REFILL_RATE_PER_MS
  bucket.tokens = Math.min(CAPACITY, bucket.tokens + tokensToAdd)
  bucket.lastRefill = now

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    return true
  }

  return false
}

export function resetRateLimiter(): void {
  userBuckets.clear()
}
