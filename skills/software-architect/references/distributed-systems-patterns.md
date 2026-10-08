# Distributed Systems Patterns & Theoretical Trade-Offs

> **Purpose**: Authoritative reference for distributed systems theorems (CAP, PACELC), distributed transaction coordination (Sagas), CQRS, Event Sourcing, and eventual consistency.

---

## 1. Fundamental Theorems: CAP & PACELC

### The CAP Theorem
In any asynchronous distributed network, network partitions ($P$) are inevitable. Therefore, you must choose between:
- **CP (Consistency + Partition Tolerance)**: In the event of a network split, reject requests or block until nodes synchronize to prevent stale reads or split-brain writes. (e.g. etcd, ZooKeeper, Google Spanner, MongoDB in primary-ack mode).
- **AP (Availability + Partition Tolerance)**: In the event of a network split, nodes accept reads and writes, serving potentially stale data and reconciling later via eventual consistency. (e.g. Amazon DynamoDB, Apache Cassandra, Couchbase).

### The PACELC Theorem (Extending CAP)
CAP only describes behavior *during* an active network partition ($P$). PACELC defines normal operation as well:
> If there is a **P**artition ($P$), how does the system trade off **A**vailability ($A$) and **C**onsistency ($C$); **E**lse ($E$), how does the system trade off **L**atency ($L$) and **C**onsistency ($C$)?

- **PC/EC**: Favors Consistency at all times (PostgreSQL synchronous replication, Spanner).
- **PA/EL**: Favors Availability during splits, and Latency during normal operation (DynamoDB with eventual consistency).

---

## 2. Distributed Transactions: The Saga Pattern

Two-Phase Commit (2PC) is a blocking protocol that introduces severe availability bottlenecks across microservices. The **Saga Pattern** manages distributed transactions as a sequence of local transactions:

```
[ Step 1: Create Order (Pending) ] ──► [ Step 2: Reserve Inventory ] ──► [ Step 3: Charge Payment ]
                                              │                                  │
                                              ▼ (Fails: Out of Stock!)           ▼ (Fails: Declined!)
                                      [ Compensate Step 1:               [ Compensate Step 2: Release Stock ]
                                        Cancel Order ]                   [ Compensate Step 1: Cancel Order ]
```

### The Two Saga Approaches
1. **Choreography (Event-Driven)**:
   - Each service publishes domain events that trigger the next local transaction in other services.
   - *Best for*: Simple 2–3 step workflows.
   - *Downside*: Hard to trace, prone to circular dependencies in complex business flows.
2. **Orchestration (State Machine Coordinator)**:
   - A centralized orchestrator (e.g. Temporal, AWS Step Functions, custom state machine) explicitly directs each service to execute its transaction or trigger its compensating rollback.
   - *Best for*: Complex multi-step business transactions. Provides clear operational observability.

---

## 3. CQRS (Command Query Responsibility Segregation)

Separate the write model (commands) from the read model (queries) to optimize them independently:

```
┌─────────────────┐       Validate & Write       ┌──────────────────┐
│  Write Command  │ ───────────────────────────► │ Normalized DB    │
│  (Mutations)    │                              │ (Postgres/OLTP)  │
└─────────────────┘                              └────────┬─────────┘
                                                          │
                                                          ▼ Async Sync (CDC / Events)
┌─────────────────┐       Fast Read Query        ┌──────────────────┐
│   Read Query    │ ◄─────────────────────────── │ Denormalized DB  │
│   (Dashboards)  │                              │ (Elastic/Redis)  │
└─────────────────┘                              └──────────────────┘
```

- **When to Use**: High-traffic systems where read queries are radically different from domain write models (e.g. complex search filtering, analytical dashboards).
- **When NOT to Use**: CRUD applications. CQRS introduces eventual consistency lag between writes and reads.

---

## 4. Event Sourcing

Instead of storing current state, store the append-only sequence of immutable domain events:
```
Event 1: OrderCreated { id: 101, customerId: 42 }
Event 2: ItemAdded { id: 101, sku: "SHIRT", qty: 2 }
Event 3: ItemRemoved { id: 101, sku: "SHIRT", qty: 1 }
Event 4: OrderPaid { id: 101, amount: 25.00 }
```
- **Current State**: Computed by folding/replaying events from the beginning of time.
- **Benefits**: Perfect audit trail, time-travel debugging, zero state loss.
- **Costs**: Schema evolution complexity, event versioning, performance overhead requiring periodic snapshots.
