# AI Product Engineer Skills

A curated repository of production-grade, authoritative AI agent skills designed for modern software engineering, system architecture, codebase onboarding, application security, automated quality assurance, clean code, and humanized code review.

Each skill in this repository is crafted to turn any AI coding agent into a principal-level specialist, equipped with mechanical sympathy for underlying compilers and runtimes, strict safety and boundary discipline, and live-documentation verification protocols to prevent obsolescence.

---

## The Complete Skills Matrix (11 Skills)

| Skill | Category | Target Scope | Description |
|---|---|---|---|
| [`software-architect`](./skills/software-architect/) | System Strategy | Distributed Systems, Monoliths & Scaling | High-level system design, Architecture Decision Records (ADRs), distributed system trade-offs (CAP/PACELC, Sagas, Outbox), modular monolith vs. microservice boundaries, cell-based reliability, and technical governance. |
| [`code-reviewer`](./skills/code-reviewer/) | Code Review & Craftsmanship | Cross-Stack (All Languages & Frameworks) | Synthesizes full-stack engineering disciplines (Next.js, TS, Node, JS, Frontend, Backend, Security, QA), enforces Uncle Bob's Clean Code principles (<15 line functions, Demeter, SOLID), and applies the `humanizer` voice to write natural, concise, non-robotic PR comments. |
| [`humanizer`](./skills/humanizer/) | Writing & De-AI-ification | PR Comments, Docs, Code Reviews, Writing | Rewrites AI-sounding text so it reads naturally like a human wrote it. Eliminates corporate buzzwords ("crucial", "pivotal", "delve", "testament"), sales language, forced groups of three, em-dash obsession, and patronizing chatbot fluff based on Wikipedia's "Signs of AI writing". |
| [`frontend-principal-engineer`](./skills/frontend-principal-engineer/) | Domain Synthesizer | React / Next.js / Modern Web Platform | Synthesizes JS, TS, React/Next.js, modern CSS architecture, Core Web Vitals (INP < 200ms, LCP < 2.5s, CLS < 0.1), WCAG 2.2 AA accessibility, and 4-quadrant state management (Server, Client, URL, Local). |
| [`backend-principal-engineer`](./skills/backend-principal-engineer/) | Domain Synthesizer | Node.js / TypeScript / PostgreSQL / Redis | Synthesizes Node.js runtimes, TypeScript data access layers, relational database engineering (PostgreSQL), idempotency keys, rate limiting, distributed caching, and at-least-once queues (BullMQ/Kafka). |
| [`qa-principal-engineer`](./skills/qa-principal-engineer/) | Quality Assurance | Universal (Web, API, Components) | Requirements-driven test planning (RTM), automated suites across the pyramid (Playwright, Cypress, Storybook, Vitest/Jest, Pytest), intense adversarial manual testing via Playwright MCP, and defect tracking. |
| [`security-principal-engineer`](./skills/security-principal-engineer/) | Application Security (AppSec) | OWASP Developer Guide v4.1.7, ASVS 4.0, Top 10 for LLMs/Agents | Grounded in the OWASP Developer Guide. Enforces Proactive Controls (C1–C10), STRIDE threat modeling, zero-trust data access, input validation, authenticated cryptography, safe agentic tool design, and P0–P3 AppSec reviews. |
| [`onboarding-engineer`](./skills/onboarding-engineer/) | DevEx & Tooling | Universal (Any Repo/Monorepo) | Rapid cold-start repository reconnaissance, deterministic local environment setup, baseline health verification (types, lint, tests, build), and architectural reverse-engineering. |
| [`nextjs-principal-engineer`](./skills/nextjs-principal-engineer/) | Full-Stack Framework | Next.js 14, 15, 16+ (React 19+) | App Router, Cache Components (`use cache`), Partial Prerendering (PPR), Server Actions, Data Access Layer (DAL), zero-trust security, Core Web Vitals, and P0–P3 code reviews. |
| [`typescript-principal-engineer`](./skills/typescript-principal-engineer/) | Language | TypeScript 5.0–5.8+ | Zero-any soundness, Branded/Nominal types, Discriminated Unions with exhaustiveness, contravariant variance, `satisfies`, and strict compiler configurations. |
| [`nodejs-principal-engineer`](./skills/nodejs-principal-engineer/) | Runtime | Node.js 20, 22, 24+ LTS | Libuv event loop mastery, stream backpressure, `node:stream/promises`, `AsyncLocalStorage`, native TypeScript type stripping, and Node permission model. |
| [`javascript-principal-engineer`](./skills/javascript-principal-engineer/) | Language Engine | ECMAScript ES2024–ES2026+ | V8 hidden classes (Shapes), Inline Caches (monomorphic optimization), garbage collection lifecycles, prototype pollution defense, and modern TC39 features. |

---

## Architectural Skill Pyramid

```
                       ┌─────────────────────────┐
                       │    software-architect   │  ◄── High-Level System Strategy, ADRs,
                       └────────────┬────────────┘      Topologies & Scalability
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌─────────────────────────┐                       ┌─────────────────────────┐
│ frontend-principal-eng  │                       │  backend-principal-eng  │
│ (The Synthesizer)       │                       │  (The Synthesizer)      │
└──────────┬──────────────┘                       └──────────┬──────────────┘
           │                                                 │
     ┌─────┴─────────────┐                             ┌─────┴─────────────┐
     ▼                   ▼                             ▼                   ▼
┌─────────┐         ┌─────────┐                   ┌─────────┐         ┌─────────┐
│ Next.js │         │  TS /   │                   │ Node.js │         │  TS /   │
│ Full-Stk│         │   JS    │                   │ Runtime │         │   JS    │
└─────────┘         └─────────┘                   └─────────┘         └─────────┘
```

Cross-Cutting Guardians:
- [`security-principal-engineer`](./skills/security-principal-engineer/): AppSec, OWASP Guide v4.1.7, STRIDE, Agentic Safety.
- [`qa-principal-engineer`](./skills/qa-principal-engineer/): Test Pyramid, Requirements RTM, Playwright MCP testing.
- [`onboarding-engineer`](./skills/onboarding-engineer/): Codebase reconnaissance, DevEx, and bootstrapping.
- [`code-reviewer`](./skills/code-reviewer/): Cross-stack review synthesis, Clean Code, and Humanized voice.
- [`humanizer`](./skills/humanizer/): Eliminating 35 patterns of AI writing.

---

## Architectural Philosophy

Every skill in this repository adheres to four uncompromising pillars:

1. **Pre-Flight Version & Docs Protocol (Never Outdated)**: Before writing code or auditing a PR, the agent inspects `package.json` to identify installed runtime/compiler versions. When working with unfamiliar or newer APIs, the agent queries official documentation live (OWASP/OpenCRE, MDN, Node.js API, TypeScript Handbook, Next.js docs) rather than guessing signatures.
2. **Dual-Mode Operation**: Dedicated workflows for **Feature Development** (building clean, idiomatic architectures from scratch) and **Code Review / QA** (structured audits using a P0 Blocker → P3 Polish taxonomy with copy-pasteable diffs).
3. **The Humanizer Mandate**: Review comments, PR descriptions, and architectural write-ups avoid condescending AI boilerplate, inflated jargon, or preachy lectures. Feedback is concise, direct, technically sound, and written like an experienced senior colleague.
4. **Progressive Disclosure**: A concise, actionable `SKILL.md` supported by a deep `references/` directory containing checklists, design patterns, and anti-pattern catalogs.

---

## Installation & Usage in OpenCode

### User-Level (Global across all projects on your machine)
Copy the skills into your OpenCode configuration directory:

```bash
# Install all skills
mkdir -p ~/.config/opencode/skills
cp -R skills/* ~/.config/opencode/skills/
```

OpenCode will automatically discover all installed skills:
```markdown
<available_skills>
  <skill><id>software-architect</id></skill>
  <skill><id>code-reviewer</id></skill>
  <skill><id>humanizer</id></skill>
  <skill><id>frontend-principal-engineer</id></skill>
  <skill><id>backend-principal-engineer</id></skill>
  <skill><id>qa-principal-engineer</id></skill>
  <skill><id>security-principal-engineer</id></skill>
  <skill><id>onboarding-engineer</id></skill>
  <skill><id>nextjs-principal-engineer</id></skill>
  <skill><id>typescript-principal-engineer</id></skill>
  <skill><id>nodejs-principal-engineer</id></skill>
  <skill><id>javascript-principal-engineer</id></skill>
</available_skills>
```

### Project-Level
To scope a skill to a specific repository, place it inside `.opencode/skills/`:

```bash
mkdir -p .opencode/skills
cp -R path/to/skills/<skill-name> .opencode/skills/
```

---

## License

[MIT](./LICENSE)
