# Architectural Smells & System Anti-Patterns

> **Purpose**: A reference catalog of the 20 most frequent macro-architectural smells, detail on their failure modes, and the idiomatic principal-architect solution.

---

### 1. The Distributed Monolith
- **Smell**: Decomposing a system into dozens of microservices that all share the same relational database or require lockstep synchronous deployments.
- **Consequence**: The latency and operational misery of microservices paired with the tight coupling and single point of failure of a monolith.
- **Fix**: Re-consolidate tightly coupled services into a single **Modular Monolith** with schema-per-module isolation.

---

### 2. Resume-Driven Development (RDD)
- **Smell**: Adopting Kubernetes, Apache Kafka, service meshes, and microservices for a 5-person team building a low-traffic application.
- **Consequence**: 80% of engineering bandwidth is consumed managing cloud infrastructure rather than delivering product value.
- **Fix**: Choose boring, mature technology. Optimize for developer velocity and operational simplicity until business scale demands distribution.

---

### 3. Database as an Inter-Process Message Bus
- **Smell**: Services communicate asynchronously by having worker processes constantly poll a database table (`SELECT * FROM tasks WHERE status = 'PENDING' LIMIT 10`) every 500ms.
- **Consequence**: Enormous database CPU load, table lock contention, and high latency.
- **Fix**: Use dedicated task queues (BullMQ, Redis Streams, SQS) or listen/notify primitives.

---

### 4. Synchronous Cascading Network Call Chains
- **Smell**: Service A calls Service B via HTTP, which calls C, which calls D.
- **Consequence**: Latency compounds multiplicatively. The overall availability of Service A becomes the product of all downstream services ($A = S_B \times S_C \times S_D$).
- **Fix**: Decouple communication using asynchronous messaging, event-driven choreographies, or materialize read data locally via CQRS.

---

### 5. Anemic Domain Model
- **Smell**: Domain entities are dumb data bags with only fields/getters, while business logic is sprawled across procedural 4,000-line "Service" classes.
- **Consequence**: Duplicate business rules, zero encapsulation, impossible to enforce domain invariants.
- **Fix**: Rich Domain Models (Domain-Driven Design). Encapsulate state mutations and validation logic inside domain entities.

---

### 6. The Golden Hammer
- **Smell**: An organization treats one database (e.g. MongoDB or PostgreSQL) as the solution to every problem, using it for relational data, document storage, caching, full-text search, and time-series analytics.
- **Consequence**: Sub-optimal performance and maintenance nightmares as scale increases.
- **Fix**: Polyglot persistence where warranted (Postgres for relational OLTP, Redis for ephemeral caching/locks, Elasticsearch for search).

---

### 7. Entity Squeeze (The Monster Table)
- **Smell**: A single `users` or `orders` table contains 85 columns, 40 of which are nullable and only apply to specific subsets of business cases.
- **Consequence**: Inefficient table heap scans, high risk of inconsistent updates.
- **Fix**: Decompose into 1:1 extension tables or separate bounded contexts (`orders` vs `order_fulfillments` vs `order_invoices`).

---

### 8. The Accidental Cloud Megabill (Unbounded Serverless)
- **Smell**: Triggering recursive serverless functions or un-throttled queue consumption that scales infinitely during a bug or DDoS attack.
- **Consequence**: Multi-thousand-dollar cloud bills overnight.
- **Fix**: Set hard concurrency limits, budget billing alerts, and circuit breakers.

---

### 9. Ignoring Conway's Law
- **Smell**: Mandating a fine-grained microservice architecture for a co-located team of 4 engineers sitting at the same table.
- **Consequence**: Immense coordination overhead, branch merging friction, and slow delivery.
- **Fix**: Align architecture with team communication structures.

---

### 10. Dual Writes Without Transactional Outbox
- **Smell**: Writing to the database and publishing to a message broker in separate un-atomic calls.
- **Consequence**: Silent event loss when broker connections hiccup, permanently desynchronizing downstream microservices.
- **Fix**: Use the Transactional Outbox Pattern with Change Data Capture (CDC).
