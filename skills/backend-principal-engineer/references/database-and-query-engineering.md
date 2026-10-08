# Database Architecture & Query Engineering

> **Purpose**: Authoritative reference for relational database design (PostgreSQL), index optimization, transaction isolation levels, row-level locking, and eliminating N+1 query bottlenecks.

---

## 1. Indexing Strategies & Query Optimization

Indexes are not free: they accelerate reads at the cost of slower writes and increased disk usage.

### Primary Index Types in PostgreSQL
1. **B-Tree (Default)**: Best for equality (`=`) and range queries (`<`, `<=`, `>`, `>=`, `BETWEEN`).
2. **GIN (Generalized Inverted Index)**: Best for composite elements, JSONB keys/paths (`@>`, `?`), full-text search, and array containment.
3. **Partial Index**: Indexes only a subset of rows meeting a `WHERE` condition (saves memory and index maintenance overhead):
   ```sql
   -- Only index active unfulfilled orders (ignoring millions of historical completed orders)
   CREATE INDEX idx_orders_unfulfilled ON orders (created_at) WHERE status = 'PENDING';
   ```
4. **Covering Index (`INCLUDE`)**: Includes non-search columns in the leaf nodes to allow Index-Only Scans without reading the table heap:
   ```sql
   CREATE INDEX idx_users_lookup ON users (email) INCLUDE (name, role);
   ```

### Rule of Composite Indexes (Leftmost Prefix Rule)
An index on `(org_id, status, created_at)` can accelerate queries on:
- `org_id`
- `org_id AND status`
- `org_id AND status AND created_at`
It **cannot** accelerate queries filtering only on `created_at` or `status` without `org_id`.

---

## 2. Eradicating the N+1 Query Problem

### The Anti-Pattern
Iterating through a list of parent entities and executing a separate SQL query for each child entity:
```ts
// ❌ N+1 DISASTER: 1 query for authors + 100 queries for books = 101 DB calls!
const authors = await db.authors.findMany()
for (const author of authors) {
  author.books = await db.books.findMany({ where: { authorId: author.id } })
}
```

### Idiomatic Solutions
1. **Eager Loading / Joins**: Use ORM inclusions (`include: { books: true }` in Prisma) which batch the queries into 2 queries (`WHERE authorId IN (...)`).
2. **DataLoader Pattern**: In GraphQL and microservices, use DataLoader to batch and memoize individual calls into a single batched SQL query per tick.

---

## 3. Transaction Isolation Levels & Concurrency Control

PostgreSQL supports three ANSI SQL transaction isolation levels:

| Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read | Serialization Anomaly |
|---|---|---|---|---|
| **Read Committed** (Default) | Impossible | Possible | Possible | Possible |
| **Repeatable Read** | Impossible | Impossible | Impossible | Possible |
| **Serializable** | Impossible | Impossible | Impossible | Impossible |

### Row-Level Locking (`SELECT ... FOR UPDATE`)
Prevent concurrent race conditions (e.g. inventory deduction, double-spending balance updates) by acquiring a row lock within a transaction:

```sql
BEGIN;

-- Lock the account row from concurrent reads/updates until this transaction completes
SELECT balance FROM accounts WHERE id = 'acc_123' FOR UPDATE;

UPDATE accounts SET balance = balance - 50.00 WHERE id = 'acc_123';

COMMIT;
```

---

## 4. The Transactional Outbox Pattern

When a service must update a database and publish an event to a message broker (Kafka/RabbitMQ), **never perform direct dual writes**:
```ts
// ❌ UNRELIABLE DUAL WRITE: If Kafka fails, DB is updated but event is lost forever!
await db.orders.create(order)
await kafka.send('order-created', order)
```

### The Solution: Transactional Outbox
1. Write both the domain entity and an `outbox` event record within the **same atomic database transaction**.
2. A separate background process (Debezium CDC or polling worker) reads the outbox table and delivers events to the broker with at-least-once delivery guarantees.
