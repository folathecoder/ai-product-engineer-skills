# Distributed Caching & Reliability Architecture

> **Purpose**: Technical playbook for enterprise caching topologies, cache stampede mitigation (thundering herd), Circuit Breaker fault isolation, and distributed locking.

---

## 1. Caching Topologies & Access Patterns

### Cache-Aside (Lazy Loading)
The application code directly queries cache. On a miss, it fetches from the primary database, writes to cache, and returns:

```ts
export async function getCachedUser(userId: string): Promise<User> {
  const cacheKey = `user:${userId}`
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  const user = await db.users.findUnique({ where: { id: userId } })
  if (user) {
    await redis.set(cacheKey, JSON.stringify(user), 'EX', 3600) // 1 hr TTL
  }
  return user
}
```

---

## 2. The Thundering Herd Problem (Cache Stampede)

When a hot cache key (e.g. homepage catalog with 100,000 requests/sec) expires, thousands of concurrent requests miss simultaneously and overwhelm the primary database, crashing the database engine.

### Defense Pattern: Single-Flight (Mutex on Cache Miss)
Only the first request is permitted to recompute the value; concurrent requests wait on a promise or distributed lock:

```ts
const inFlightRequests = new Map<string, Promise<any>>()

export async function singleFlight<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key) as Promise<T>
  }

  const promise = fn().finally(() => {
    inFlightRequests.delete(key)
  })

  inFlightRequests.set(key, promise)
  return promise
}
```

---

## 3. Circuit Breaker Pattern for External Dependencies

Prevent cascading system collapse when an external dependency (Stripe, Twilio, third-party microservice) begins failing:

```
                ┌───────────────────────────────────┐
                │             CLOSED                │
                │ Normal operation: requests pass   │
                └───────────────┬───────────────────┘
                                │ (Failure rate > 50%)
                                ▼
                ┌───────────────────────────────────┐
                │              OPEN                 │
                │ Fails fast immediately: no calls  │
                └───────────────┬───────────────────┘
                                │ (After reset timeout, e.g. 30s)
                                ▼
                ┌───────────────────────────────────┐
                │            HALF-OPEN              │
                │ Probe with single trial request   │
                └───────────────────────────────────┘
```

- When in the **OPEN** state, calls reject immediately without creating network sockets or waiting for connection timeouts, shielding your own thread pool and servers.

---

## 4. Distributed Locks & Fencing Tokens

When coordinating exclusive actions across multiple server instances (e.g. processing a monthly batch invoice):
- Use Redis atomic commands (`SET key lock_id NX EX 30`).
- **Fencing Tokens**: Always pair distributed locks with a monotonically increasing fencing token (`token = 101, 102, 103`) passed to storage engines. If a process experiences a GC pause and its lock expires, the database rejects updates bearing an outdated fencing token.
