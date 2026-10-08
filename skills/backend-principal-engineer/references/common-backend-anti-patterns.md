# Top 25 Backend Anti-Patterns & Canonical Fixes

> **Purpose**: A reference catalog of the 25 most frequent backend anti-patterns, detail on their failure modes, and the idiomatic principal-level solution.

---

### 1. Dual Writes to Database and Message Queue
- **Failure Mode**: Writing to the database and then publishing to Kafka/RabbitMQ without an atomic boundary. If the message broker fails, the database is updated but the event is lost forever, causing permanent state desynchronization.
- **Fix**: Implement the **Transactional Outbox Pattern** within the database transaction.

---

### 2. Unindexed Foreign Keys and Filtering Columns
- **Failure Mode**: Queries filtering on `tenant_id` or `status` trigger sequential table scans over millions of rows, spiking database CPU to 100%.
- **Fix**: Create appropriate B-Tree or Partial Indexes for all foreign keys and query predicate columns.

---

### 3. Missing Database Transactions on Multi-Entity Updates
- **Failure Mode**: Step 1 succeeds (user debit), but Step 2 crashes (order creation), leaving the database in an inconsistent, corrupted state.
- **Fix**: Wrap multi-step operations inside atomic database transactions (`BEGIN ... COMMIT`).

---

### 4. Non-Idempotent Webhook Processing
- **Failure Mode**: Stripe or GitHub delivers a webhook multiple times due to network retries, causing double billing or duplicate user accounts.
- **Fix**: Deduplicate incoming webhooks by caching event IDs in Redis or database before processing.

---

### 5. Offset Pagination on Massive Tables (`OFFSET 500000`)
- **Failure Mode**: The database engine reads, sorts, and discards hundreds of thousands of rows before returning a single page, resulting in massive disk I/O.
- **Fix**: Use keyset/cursor-based pagination (`WHERE (created_at, id) < (:cursor_created_at, :cursor_id)`).

---

### 6. Synchronous Long-Running Third-Party Calls in HTTP Handlers
- **Failure Mode**: Generating a PDF, calling an AI model, or transcode a video synchronously inside an HTTP request handler holds open client connections and server worker threads until timeouts occur.
- **Fix**: Offload long-running tasks to background queues (BullMQ/pg-boss) and return `202 Accepted` with a job ID.

---

### 7. Thundering Herd on Hot Cache Expiration
- **Failure Mode**: A popular cached entity expires, and 50,000 concurrent requests simultaneously hit the primary database.
- **Fix**: Implement single-flight mutexes or probabilistic early expiration (XFetch).

---

### 8. Retry Storms without Jitter
- **Failure Mode**: Hundreds of service instances retry failing database connections simultaneously at exactly the same 5-second interval, knocking down recovering databases.
- **Fix**: Implement exponential backoff with full randomized jitter.

---

### 9. Missing Circuit Breakers on Downstream Services
- **Failure Mode**: A failing payment gateway takes 30 seconds to time out per request, consuming all application threads and cascading failure throughout your entire service.
- **Fix**: Wrap downstream network calls in a Circuit Breaker that fails fast when error thresholds are crossed.

---

### 10. Missing Row-Level Locks on Race-Sensitive State
- **Failure Mode**: Two concurrent requests read balance `$100`, subtract `$50`, and write `$50`, allowing a user to spend `$100` twice.
- **Fix**: Use `SELECT ... FOR UPDATE` inside a database transaction to serialize updates to that row.

---

### 11. Leaking Database Connections
- **Failure Mode**: Acquiring a database connection from a connection pool inside a `try` block but failing to release it in `finally` upon unexpected errors, eventually causing pool exhaustion.
- **Fix**: Always release connections inside a `finally` block or use ORMs with automatic connection lifecycle management.

---

### 12. Missing Dead Letter Queues (Poison Pill Hangs)
- **Failure Mode**: A malformed message in a queue crashes the worker on every attempt, infinitely retrying and blocking the queue.
- **Fix**: Route failed messages to a Dead Letter Queue (DLQ) after 3–5 failed attempts.

---

### 13. Exposing Auto-Incrementing Database IDs (`/users/1`)
- **Failure Mode**: Predictable sequential IDs allow adversaries to scrape all records via trivial ID iteration (IDOR).
- **Fix**: Use random UUIDv4, ULIDs, or nanoids for all public-facing entity identifiers.

---

### 14. Missing Query Timeout Budgets (`statement_timeout`)
- **Failure Mode**: A complex analytical query hangs indefinitely, holding database table locks and starving production transactional queries.
- **Fix**: Enforce strict statement timeouts in database connection configs (e.g. `statement_timeout = 5000` ms).

---

### 15. The Distributed Monolith Anti-Pattern
- **Failure Mode**: Breaking a system into 15 microservices that depend on synchronous REST calls to each other for every simple operation, multiplying latency and failure points.
- **Fix**: Prefer a Modular Monolith or design loosely coupled asynchronous event-driven boundaries.

---

### 16. Blind Horizontal Scaling Exceeding Database Connection Limits
- **Failure Mode**: Autoscaling a Node.js service to 100 containers, each with a connection pool of 20, exceeding PostgreSQL's `max_connections` (1000) and crashing the database.
- **Fix**: Use connection poolers like PgBouncer or Supavisor in front of PostgreSQL.

---

### 17. Inconsistent API Error Envelopes
- **Failure Mode**: Some endpoints return `{ error: "msg" }`, others return `{ message: "msg" }`, and others return plain HTML stack traces.
- **Fix**: Standardize on RFC 7807 Problem Details across all API endpoints.

---

### 18. Plaintext String Logging Instead of Structured JSON
- **Failure Mode**: Logging unstructured strings (`console.log("user logged in " + id)`) prevents querying, filtering, and aggregation in log analysis tools (Datadog, CloudWatch).
- **Fix**: Use structured JSON loggers (`pino`, `winston`) with contextual key-value pairs.

---

### 19. Storing Unsalted Passwords or Fast Hashes
- **Failure Mode**: Hashing passwords with SHA-256 or MD5 enables instant reverse lookups via rainbow tables.
- **Fix**: Use memory-hard key stretching algorithms: Argon2id or bcrypt (cost factor >= 12).

---

### 20. Neglecting Timezone Conversions in Database Queries
- **Failure Mode**: Storing timestamps in local server time, leading to calculation errors during Daylight Saving Time or across multi-region deployments.
- **Fix**: Always store and compute timestamps in UTC (`TIMESTAMPTZ` in PostgreSQL).

---

### 21. Over-Fetching Columns with `SELECT *`
- **Failure Mode**: Fetching 40 columns including large text/blob fields when only `id` and `email` were needed, inflating memory usage and preventing index-only scans.
- **Fix**: Explicitly select only necessary columns.

---

### 22. Database Migrations with Heavy Table Locks on Production
- **Failure Mode**: Running `ALTER TABLE orders ADD COLUMN status VARCHAR DEFAULT 'pending'` on a table with 20M rows takes an exclusive lock for 30 minutes, causing a complete site outage.
- **Fix**: Use non-blocking migration patterns (e.g. `ADD COLUMN` without default first, backfill in chunks, then set default; `CREATE INDEX CONCURRENTLY`).

---

### 23. Storing JWT Secrets in Repository Configs
- **Failure Mode**: Hardcoding HMAC secrets in `config.json` allows anyone with repository access to forge administrative authentication tokens.
- **Fix**: Store all cryptographic secrets in environment variables or cloud secrets managers.

---

### 24. Missing In-Flight Request Cancellation on Disconnect
- **Failure Mode**: A client cancels an HTTP request, but the backend continues running an expensive 10-second report generation query.
- **Fix**: Listen to the client request close signal (`req.on('close')`) and cancel database queries via `AbortController`.

---

### 25. Relying on In-Memory Caches in Multi-Instance Deployments
- **Failure Mode**: Caching user permissions in a local JavaScript variable across 4 server instances results in inconsistent permissions depending on which node the load balancer hits.
- **Fix**: Use a shared distributed cache (Redis) or invalidate across nodes using Redis Pub/Sub.
