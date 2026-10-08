# Cross-Stack Code Review Matrix

> **Purpose**: The multi-discipline inspection engine combining Next.js, TypeScript, Node.js, JavaScript, Frontend, Backend, Security, QA, and Clean Code into a unified code review workflow.

---

## 1. Multi-Discipline Inspection Map

When reviewing code, examine each file through these specialized lenses:

| Discipline Lens | Primary Skill | What to Scrutinize |
|---|---|---|
| **Clean Code & Craftsmanship** | `code-reviewer` | Function length (<15 lines), meaningful names, Law of Demeter, DRY, single responsibility (SRP), no commented-out code. |
| **Type Safety & Soundness** | `typescript-principal-engineer` | Zero `any`, no double assertions (`as unknown as`), exhaustive union checks (`assertNever`), `readonly` parameters, `noUncheckedIndexedAccess`. |
| **Application Security** | `security-principal-engineer` | OWASP Top 10, IDOR access checks, SQL parameterization, SSRF protection on URLs, input validation (Zod), no secrets in code. |
| **Full-Stack & React (Next.js)** | `nextjs-principal-engineer` | RSC boundaries, pushing `'use client'` to leaves, Cache Components (`use cache`), Server Action authentication, PPR static shell. |
| **Runtime & Concurrency (Node.js)** | `nodejs-principal-engineer` | Zero sync I/O in handlers, stream backpressure with `pipeline`, `AsyncLocalStorage` context retention, unhandled rejections. |
| **Language & Engine (JavaScript)** | `javascript-principal-engineer` | V8 monomorphic shapes, no async in `forEach`, immutability with ES2023 copy methods, closure memory leak prevention. |
| **Frontend & UX** | `frontend-principal-engineer` | 4 state quadrants (no server mirroring in `useEffect`), Core Web Vitals (INP/LCP/CLS), WCAG 2.2 AA accessibility, layout thrashing. |
| **Backend & Persistence** | `backend-principal-engineer` | Database indexes, no N+1 query loops, transactional outbox for dual writes, idempotency keys, row-level locks (`SELECT FOR UPDATE`). |
| **Test Quality & Coverage** | `qa-principal-engineer` | Test pyramid balance, boundary value analysis (min/max/off-by-one), negative path coverage, deterministic mocks without network flakiness. |

---

## 2. The 3-Pass Review Strategy

### Pass 1: Architecture, Security & Boundaries (High Level)
- Does this change belong in this module?
- Are new trust boundaries introduced?
- Does it introduce secret leaks, unauthenticated endpoints, or broken access controls?
- Are database schemas indexed and migrations non-blocking?

### Pass 2: Logic, Concurrency & Edge Cases (Mid Level)
- What happens on network disconnect or timeout?
- Are race conditions possible on rapid button clicks or concurrent requests?
- Are inputs validated using schemas before mutation?
- Are error boundaries and catch blocks properly handling exceptions without swallowing redirects?

### Pass 3: Clean Code & Readability (Line Level)
- Are functions doing one thing? Can 40-line functions be split into small units?
- Are variable and function names self-documenting?
- Are there redundant comments or commented-out code blocks?
- Are types sound and free of `any`?
