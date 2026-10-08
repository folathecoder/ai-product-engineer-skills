# AI Product Engineer Skills

A curated repository of production-grade, authoritative AI agent skills designed for modern software engineering, architecture, codebase onboarding, application security, automated quality assurance, clean code, and humanized code review.

Each skill in this repository is crafted to turn any AI coding agent into a principal-level specialist, equipped with mechanical sympathy for underlying compilers and runtimes, strict safety and boundary discipline, and live-documentation verification protocols to prevent obsolescence.

---

## Available Skills Matrix

| Skill | Focus | Target Scope | Description |
|---|---|---|---|
| [`code-reviewer`](./skills/code-reviewer/) | Multi-Discipline Code Review & Clean Code | Cross-Stack (All Languages & Frameworks) | Synthesizes full-stack engineering disciplines (Next.js, TS, Node, JS, Frontend, Backend, Security, QA), enforces Uncle Bob's Clean Code principles (<15 line functions, Demeter, SOLID), and applies the `humanizer` voice to write natural, concise, non-robotic PR comments. |
| [`humanizer`](./skills/humanizer/) | Prose De-AI-ification & Natural Writing | PR Comments, Docs, Code Reviews, Writing | Rewrites AI-sounding text so it reads naturally like a human wrote it. Eliminates corporate buzzwords ("crucial", "pivotal", "delve", "testament"), sales language, forced groups of three, em-dash obsession, and patronizing chatbot fluff based on Wikipedia's "Signs of AI writing". |
| [`frontend-principal-engineer`](./skills/frontend-principal-engineer/) | Frontend Synthesis, State & Web Vitals | React / Next.js / Modern Web Platform | Synthesizes JS, TS, React/Next.js, modern CSS architecture, Core Web Vitals (INP < 200ms, LCP < 2.5s, CLS < 0.1), WCAG 2.2 AA accessibility, and 4-quadrant state management (Server, Client, URL, Local). |
| [`backend-principal-engineer`](./skills/backend-principal-engineer/) | Scalable Services, Data Layers & Distributed Systems | Node.js / TypeScript / PostgreSQL / Redis | Synthesizes Node.js runtimes, TypeScript data access layers, relational database engineering (PostgreSQL), idempotency keys, rate limiting, distributed caching, and at-least-once queues (BullMQ/Kafka). |
| [`qa-principal-engineer`](./skills/qa-principal-engineer/) | Quality Assurance, Automated Tests & Exploratory QA | Universal (Web, API, Components) | Requirements-driven test planning (RTM), automated suites across the pyramid (Playwright, Cypress, Storybook, Vitest/Jest, Pytest), intense adversarial manual testing via Playwright MCP, and defect tracking. |
| [`security-principal-engineer`](./skills/security-principal-engineer/) | Application Security (AppSec), Threat Modeling & Review | OWASP Developer Guide v4.1.7, ASVS 4.0, Top 10 for LLMs/Agents | Grounded in the OWASP Developer Guide. Enforces Proactive Controls (C1–C10), STRIDE threat modeling, zero-trust data access, input validation, authenticated cryptography, safe agentic tool design, and P0–P3 AppSec reviews. |
| [`onboarding-engineer`](./skills/onboarding-engineer/) | Codebase Reconnaissance, DevEx & Bootstrapping | Universal (Any Repo/Monorepo) | Rapid cold-start repository reconnaissance, deterministic local environment setup, baseline health verification (types, lint, tests, build), and architectural reverse-engineering. |
| [`nextjs-principal-engineer`](./skills/nextjs-principal-engineer/) | Full-Stack Architecture, Development & Review | Next.js 14, 15, 16+ (React 19+) | App Router, Cache Components (`use cache`), Partial Prerendering (PPR), Server Actions, Data Access Layer (DAL), zero-trust security, Core Web Vitals, and P0–P3 code reviews. |
| [`typescript-principal-engineer`](./skills/typescript-principal-engineer/) | Type System Architecture, Modeling & Review | TypeScript 5.0–5.8+ | Zero-any soundness, Branded/Nominal types, Discriminated Unions with exhaustiveness, contravariant variance, `satisfies`, and strict compiler configurations. |
| [`nodejs-principal-engineer`](./skills/nodejs-principal-engineer/) | High-Throughput Runtimes, I/O & Review | Node.js 20, 22, 24+ LTS | Libuv event loop mastery, stream backpressure, `node:stream/promises`, `AsyncLocalStorage`, native TypeScript type stripping, and Node permission model. |
| [`javascript-principal-engineer`](./skills/javascript-principal-engineer/) | Language Mechanics, V8 Optimization & Review | ECMAScript ES2024–ES2026+ | V8 hidden classes (Shapes), Inline Caches (monomorphic optimization), garbage collection lifecycles, prototype pollution defense, and modern TC39 features. |

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

## Roadmap

- [x] `code-reviewer` (Cross-Stack Reviewer, Clean Code Principles, Humanizer Voice)
- [x] `humanizer` (Prose De-AI-ification & Natural Writing)
- [x] `frontend-principal-engineer` (Domain Synthesizer: orchestrates JS, TS, React/Next.js, CSS, Web Vitals, A11y)
- [x] `backend-principal-engineer` (Domain Synthesizer: orchestrates Node.js, TS, Databases, Distributed Systems, Queues)
- [x] `qa-principal-engineer` (Automated Tests, Playwright MCP Manual Testing, Test Planning)
- [x] `security-principal-engineer` (AppSec, OWASP Guide, Threat Modeling, Agentic Security)
- [x] `onboarding-engineer` (Codebase Reconnaissance & DevEx)
- [x] `nextjs-principal-engineer` (Full-Stack React Framework)
- [x] `typescript-principal-engineer` (Foundational Language)
- [x] `nodejs-principal-engineer` (Foundational Runtime)
- [x] `javascript-principal-engineer` (Language Engine & V8)
- [ ] `software-architect` (System Strategist: ADRs, System Boundaries, Scalability, Threat Modeling)

---

## License

[MIT](./LICENSE)
