# System Topologies & Architectural Trade-Offs

> **Purpose**: A pragmatic, battle-tested decision guide for selecting system topologies: Monoliths, Modular Monoliths, Microservices, and Event-Driven Serverless.

---

## 1. The 4 Primary System Topologies

| Dimension | Monolith | Modular Monolith | Microservices | Event-Driven Serverless |
|---|---|---|---|---|
| **Deployment** | Single unified binary/container. | Single unified deployment artifact. | Dozens of independently deployed services. | Functions triggered by cloud events. |
| **Communication** | In-memory function calls (nanoseconds). | In-memory function calls with strict interface boundaries. | Network I/O (REST, gRPC, HTTP) (milliseconds). | Event brokers (Kafka, SQS, EventBridge). |
| **Database** | Single shared database. | Single database with schema-per-module isolation. | Strict **Database-per-Service**. | Managed serverless databases (DynamoDB, Aurora Serverless). |
| **Operational Overhead** | Low (Single CI/CD, single container). | Low (Single deployment, in-process testing). | **Very High** (Kubernetes, service mesh, distributed tracing). | Medium (Cloud vendor lock-in, cold starts). |
| **Ideal Team Size** | 1–15 engineers | 10–100 engineers | 100+ engineers across multiple autonomous squads | Event-heavy workflows, spiky workloads. |

---

## 2. The Golden Rule of Architecture

> **"Don't distribute your system until you are forced to."**

A poorly designed monolith is painful. But a distributed system built on poor boundaries is a **Distributed Monolith**—the worst architectural state possible:
- It suffers the deployment fragility and network latency of microservices.
- While retaining the tight coupling and shared failure modes of a monolith.

---

## 3. The Power of the Modular Monolith

For 95% of growing engineering organizations, the **Modular Monolith** provides the optimal balance of developer velocity and architectural hygiene:

```
┌────────────────────────────────────────────────────────┐
│               MODULAR MONOLITH CONTAINER               │
│                                                        │
│  ┌──────────────────┐    Public API   ┌─────────────┐  │
│  │  Orders Module   │ ──────────────► │ User Module │  │
│  │  (Domain Logic)  │  (In-process)   │ (Auth/PII)  │  │
│  └────────┬─────────┘                 └──────┬──────┘  │
│           │                                  │         │
└───────────┼──────────────────────────────────┼─────────┘
            ▼                                  ▼
   Postgres: `orders` schema          Postgres: `users` schema
```

### Invariants of a True Modular Monolith
1. **In-Process Communication**: Modules call each other via strongly typed public interfaces (TypeScript interfaces or internal packages), eliminating network latency and serialization overhead.
2. **Strict Boundary Enforcement**: Lint rules or build tools (Nx, Turborepo, Dependency Cruiser) forbid Module A from importing private internal files of Module B.
3. **Database Schema Isolation**: Each module owns its dedicated database schema (`orders.*` vs `billing.*`). Modules **never** execute cross-schema foreign keys or joins. If an extraction to an independent microservice is needed later, the database is already separated!

---

## 4. Conway's Law & Team Topology

> **"Organizations which design systems are constrained to produce designs which are copies of the communication structures of these organizations."** — Melvin Conway

- Architecture must match team structure. If you have a team of 6 engineers, microservices create coordination bottlenecks.
- Microservices only become advantageous when independent, cross-functional teams (5–8 people each) need to deploy to production multiple times per day without cross-team sync meetings.

---

## 5. Domain-Driven Design (DDD) & Context Mapping

When integrating multiple bounded contexts:
- **Shared Kernel**: A small, shared library of domain primitives (e.g. `Money`, `Currency`, `TenantId`) co-owned by teams. Keep minimal.
- **Anti-Corruption Layer (ACL)**: A translation adapter placed at the boundary when integrating with legacy systems or third-party APIs to prevent external models from polluting your clean domain model.
