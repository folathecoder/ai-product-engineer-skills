# AI Product Engineer Skills

A curated repository of production-grade, authoritative AI agent skills designed for modern software engineering, architecture, codebase onboarding, application security, and quality assurance.

Each skill in this repository is crafted to turn any AI coding agent into a principal-level specialist, equipped with mechanical sympathy for underlying compilers and runtimes, strict safety and boundary discipline, and live-documentation verification protocols to prevent obsolescence.

---

## Available Skills Matrix

| Skill | Focus | Target Scope | Description |
|---|---|---|---|
| [`qa-principal-engineer`](./skills/qa-principal-engineer/) | Quality Assurance, Automated Tests & Exploratory Testing | Universal (Web, API, Components) | Requirements-driven test planning (RTM), automated suites across the pyramid (Playwright, Cypress, Storybook, Vitest/Jest, Pytest), intense adversarial manual testing via Playwright MCP, and defect tracking. |
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
3. **Progressive Disclosure**: A concise, actionable `SKILL.md` supported by a deep `references/` directory containing checklists, design patterns, and anti-pattern catalogs.
4. **Interoperability**: Skills seamlessly reference each other across the stack (e.g. `qa-principal-engineer` validating `nextjs-principal-engineer` and `security-principal-engineer` assertions; upcoming Frontend/Backend synthesizers orchestrating the foundation).

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

- [x] `qa-principal-engineer` (Automated Tests, Playwright MCP Manual Testing, Test Planning)
- [x] `security-principal-engineer` (AppSec, OWASP Guide, Threat Modeling, Agentic Security)
- [x] `onboarding-engineer` (Codebase Reconnaissance & DevEx)
- [x] `nextjs-principal-engineer` (Full-Stack React Framework)
- [x] `typescript-principal-engineer` (Foundational Language)
- [x] `nodejs-principal-engineer` (Foundational Runtime)
- [x] `javascript-principal-engineer` (Language Engine & V8)
- [ ] `frontend-principal-engineer` (Domain Synthesizer: orchestrates JS, TS, React/Next.js, CSS, Web Vitals, A11y)
- [ ] `backend-principal-engineer` (Domain Synthesizer: orchestrates Node.js, TS, Databases, Distributed Systems, Queues)
- [ ] `software-architect` (System Strategist: ADRs, System Boundaries, Scalability, Threat Modeling)

---

## License

[MIT](./LICENSE)
