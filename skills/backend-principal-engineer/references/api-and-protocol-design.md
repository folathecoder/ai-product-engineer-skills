# API Architecture & Protocol Engineering

> **Purpose**: Authoritative reference for designing enterprise-grade APIs across REST, GraphQL, and gRPC, implementing idempotency keys, rate limiting, and cursor pagination.

---

## 1. Idempotency Keys Architecture (Zero Duplicate Charges)

Network timeouts often leave clients uncertain if a mutation succeeded. Critical mutations (payments, orders, reservations) must support the `Idempotency-Key` header:

```
Client ──► [ POST /api/charges (Idempotency-Key: "uuid-123") ]
                 │
                 ▼
       ┌───────────────────────────┐
       │ Redis: SET key NX EX 120  │ ──► Key already exists?
       └─────────────┬─────────────┘          │
                     │ (First time)           │ (Duplicate request)
                     ▼                        ▼
       Execute business transaction     Return saved response
       Save response in Redis           immediately without re-running
```

### Canonical Redis Implementation Pattern
```ts
export async function withIdempotency<T>(
  key: string,
  ttlSeconds: number,
  execute: () => Promise<T>
): Promise<T> {
  const redisKey = `idempotency:${key}`

  // 1. Check if cached response exists
  const existing = await redis.get(redisKey)
  if (existing) {
    return JSON.parse(existing) as T
  }

  // 2. Acquire atomic distributed lock (NX = only set if not exists)
  const acquired = await redis.set(`lock:${redisKey}`, 'locked', 'EX', 30, 'NX')
  if (!acquired) {
    throw new ConflictError('Concurrent request in flight with identical idempotency key')
  }

  try {
    const result = await execute()
    // 3. Cache completed response
    await redis.set(redisKey, JSON.stringify(result), 'EX', ttlSeconds)
    return result
  } finally {
    await redis.del(`lock:${redisKey}`)
  }
}
```

---

## 2. Rate Limiting Algorithms

### Sliding Window Counter (Redis Sorted Set)
Provides smooth rate limiting without boundary-burst vulnerabilities:

```ts
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `rate_limit:${identifier}`
  const now = Date.now()
  const windowStart = now - windowSeconds * 1000

  const pipeline = redis.pipeline()
  // 1. Remove elements outside current window
  pipeline.zremrangebyscore(key, 0, windowStart)
  // 2. Count requests in current window
  pipeline.zcard(key)
  // 3. Add current timestamp
  pipeline.zadd(key, now, `${now}-${Math.random()}`)
  // 4. Set TTL on the set
  pipeline.expire(key, windowSeconds)

  const results = await pipeline.exec()
  const requestCount = results[1][1] as number

  return {
    allowed: requestCount < limit,
    remaining: Math.max(0, limit - requestCount - 1),
  }
}
```

---

## 3. High-Performance Pagination: Cursor vs. Offset

### Offset Pagination (`OFFSET 100000 LIMIT 20`) — Anti-Pattern for Large Datasets
The database must read, sort, and discard the first 100,000 rows from disk before returning 20 rows. Query latency degrades linearly as the user pages deeper.

### Keyset / Cursor Pagination (`WHERE id > :cursor LIMIT 20`) — Optimal
Leverages B-Tree index seek directly to the target record in O(1) time regardless of depth:

```sql
-- Fast O(1) index seek
SELECT id, title, created_at
FROM articles
WHERE (created_at, id) < (:cursor_created_at, :cursor_id)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

---

## 4. Standard Error Envelopes (RFC 7807 Problem Details)

All API errors should return standardized, machine-readable JSON envelopes:

```json
{
  "type": "https://api.example.com/errors/invalid-payment",
  "title": "Invalid Payment Method",
  "status": 422,
  "detail": "The credit card provided has expired.",
  "instance": "/api/v1/orders/ord_987/payments",
  "code": "CARD_EXPIRED",
  "invalidParams": [
    { "name": "expirationDate", "reason": "Must be in the future" }
  ]
}
```
