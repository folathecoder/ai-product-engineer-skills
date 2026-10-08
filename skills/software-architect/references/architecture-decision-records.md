# Architecture Decision Records (ADRs) Framework

> **Purpose**: A lightweight, version-controlled standard for recording important architectural decisions, context, trade-offs, and consequences to eliminate "architectural amnesia" across engineering teams.

---

## 1. Why ADRs Matter

Code records *what* was built. Git commit messages record *when* it was changed. **Architecture Decision Records (ADRs) record *why* it was designed that way.**

Without ADRs:
- New engineers inevitably question past decisions without understanding the constraints that drove them.
- Teams repeat past mistakes or blindly reverse intentional trade-offs.
- Decisions are lost in ephemeral Slack threads or meeting notes.

---

## 2. The Lifecycle of an ADR

```
  ┌──────────────┐
  │   PROPOSED   │ ──► Under RFC review and team discussion
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │   ACCEPTED   │ ──► Authoritative standard; guides implementation
  └──────┬───────┘
         │
         ├────────────────────────────────────────┐
         ▼                                        ▼
  ┌──────────────┐                         ┌──────────────┐
  │  DEPRECATED  │                         │  SUPERSEDED  │ (Replaced by ADR-XXXX)
  └──────────────┘                         └──────────────┘
```

- **Immutable History**: Once Accepted, an ADR is never silently edited to change the past. If a decision changes, create a new ADR that explicitly marks the prior one as `Superseded by ADR-XXXX`.

---

## 3. Standard ADR Specification Template (Nygard Style)

```markdown
# ADR-[NUMBER]: [Short, Descriptive Title of Decision]

- **Status**: [Proposed | Accepted | Deprecated | Superseded by ADR-XXXX]
- **Date**: YYYY-MM-DD
- **Deciders**: [List of tech leads, architects, and engineers involved]
- **Consulted / Informed**: [Stakeholders, product managers, security leads]

---

### 1. Context & Problem Statement
[Describe the business or technical context. What problem are we solving? What forces, constraints, compliance requirements, or performance thresholds apply?]

---

### 2. Decision
[State the exact decision in active voice. e.g. "We will adopt a Modular Monolith architecture using PostgreSQL schemas and pnpm workspaces instead of decomposing into independent microservices."]

---

### 3. Consequences

#### Positive (Benefits)
- [Explicit architectural gains, developer velocity improvements, or reduced latency]
- [Example: Single deployment artifact simplifies CI/CD and zero network hop RPCs]

#### Negative (Trade-offs & Costs)
- [Every real architectural decision has a cost. Be honest about downsides]
- [Example: Shared database connection pool requires strict statement timeouts]

#### Neutral
- [Side effects that are neither inherently good nor bad, but change team workflow]

---

### 4. Alternatives Considered & Rejection Rationale

#### Alternative A: [Option Name]
- *Pros*: ...
- *Cons*: ...
- *Reason for Rejection*: [Concrete reason why this option was inferior for our specific constraints]

#### Alternative B: [Option Name]
- *Reason for Rejection*: ...

---

### 5. Implementation & Review Milestones
- [ ] Phase 1: Prototype core module boundary.
- [ ] Phase 2: Lint rules prohibiting cross-boundary imports.
- [ ] Phase 3: Production rollout and metric verification.
```
