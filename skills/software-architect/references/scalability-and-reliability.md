# Enterprise Scalability & High-Availability Architecture

> **Purpose**: Technical playbook for multi-tier caching architectures, horizontal database scaling, disaster recovery (RTO/RPO), and cell-based reliability engineering.

---

## 1. The 5-Tier Caching Hierarchy

True high-performance systems utilize layered caching so that the vast majority of requests never touch the database:

```
[ Client Browser ] ──────────► 1. HTTP Cache (Service Worker, Cache-Control)
       │
       ▼
[ Cloud Edge ] ──────────────► 2. Edge CDN Cache (Cloudflare, Vercel Edge, Fastly)
       │
       ▼
[ API Gateway / Proxy ] ─────► 3. Reverse Proxy Cache (NGINX, Envoy, Coraza)
       │
       ▼
[ Application Container ] ───► 4. In-Process Cache (Memory LRU, local heap)
       │
       ▼
[ Distributed Layer ] ───────► 5. Shared Distributed Cache (Redis cluster)
       │
       ▼
[ Primary Database ] ────────► 6. Database Engine Buffer Pool (SRAM/NVMe)
```

---

## 2. Horizontal Database Scaling

When a single relational database instance hits resource limits (CPU/Memory/IOPS):

### Step 1: Read Replicas with Replication Lag Discipline
- Route read-only analytical queries and dashboard traffic to Read Replicas.
- **Critical Caveat (Replication Lag)**: If a user writes a new record and is immediately redirected to view it, reading from an asynchronous replica may return 404.
  - *Rule*: Read from the **primary database** for 5–10 seconds immediately following a user mutation (read-your-writes consistency).

### Step 2: Database Sharding & Partitioning
- **Table Partitioning (Declarative)**: Split a single huge table into smaller physical partitions by date range or hash within the same database engine.
- **Application-Level Sharding**: Distribute rows across multiple independent physical database instances using a **Shard Key** (e.g. `organization_id` or `tenant_id`).
  - *Rule*: Shard keys must distribute traffic evenly. Avoid cross-shard joins and cross-shard transactions.

---

## 3. High Availability & Disaster Recovery (DR)

### Business Metrics: RTO & RPO
- **RTO (Recovery Time Objective)**: How long the business can tolerate being down before the system is restored (e.g. RTO = 15 minutes).
- **RPO (Recovery Point Objective)**: How much data loss the business can tolerate measured in time (e.g. RPO = 5 minutes of lost transactions).

### Multi-Region Topologies

| Topology | RTO | Cost | Complexity |
|---|---|---|---|
| **Backup & Restore** | Hours | Lowest | Low (Cold snapshots in S3) |
| **Pilot Light** | 10–30 mins | Low | Medium (Replicated DB, minimal compute) |
| **Warm Standby (Active-Passive)** | 1–5 mins | Medium | Medium-High (Scaled compute in standby region) |
| **Multi-Region Active-Active** | < 1 min | Highest | **Very High** (Requires conflict-free replicated data types CRDTs) |

---

## 4. Cell-Based Architecture (Containing Blast Radius)

Instead of running one massive cluster where a single bad deployment or database outage crashes the entire global user base:
- Partition the entire infrastructure into independent, self-contained **Cells** (e.g. Cell 1 handles Tenants A–F, Cell 2 handles Tenants G–L).
- Each cell contains its own frontend, backend services, and database.
- A global routing layer (Cell Router) directs incoming requests to the appropriate cell.
- If Cell 1 fails, **only 10% of users are impacted**, while the remaining 90% continue operating normally.
