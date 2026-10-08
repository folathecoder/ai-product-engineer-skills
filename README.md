# AI Product Engineer Skills

A curated repository of production-grade, authoritative AI agent skills designed for modern software engineering, architecture, and code review.

Each skill in this repository is crafted to turn any AI coding agent into a principal-level specialist, equipped with mechanical sympathy for underlying compilers and runtimes, strict safety and boundary discipline, and live-documentation verification protocols to prevent obsolescence.

---

## Available Skills Matrix

| Skill | Focus | Target Versions | Description |
|---|---|---|---|
| [`nextjs-principal-engineer`](./skills/nextjs-principal-engineer/) | Full-Stack Architecture, Development & Code Review | Next.js 14, 15, 16+ (React 19+) | App Router, Cache Components (`use cache`), Partial Prerendering (PPR), Server Actions, Data Access Layer (DAL), zero-trust security, Core Web Vitals, and P0–P3 code reviews. |
| [`typescript-principal-engineer`](./skills/typescript-principal-engineer/) | Type System Architecture, Modeling & Review | TypeScript 5.0–5.8+ | Zero-any soundness, Branded/Nominal types, Discriminated Unions with exhaustiveness, contravariant variance, `satisfies`, and strict compiler configurations. |
| [`nodejs-principal-engineer`](./skills/nodejs-principal-engineer/) | High-Throughput Runtimes, I/O & Review | Node.js 20, 22, 24+ LTS | Libuv event loop mastery, stream backpressure, `node:stream/promises`, `AsyncLocalStorage`, native TypeScript type stripping, and Node permission model. |
| [`javascript-principal-engineer`](./skills/javascript-principal-engineer/) | Language Mechanics, V8 Optimization & Review | ECMAScript ES2024–ES2026+ | V8 hidden classes (Shapes), Inline Caches (monomorphic optimization), garbage collection lifecycles, prototype pollution defense, and modern TC39 features. |

---

## Architectural Philosophy

Every skill in this repository adheres to four uncompromising pillars:

1. **Pre-Flight Version & Docs Protocol (Never Outdated)**: Before writing code or auditing a PR, the agent inspects `package.json` to identify installed runtime/compiler versions. When working with unfamiliar or newer APIs, the agent queries official documentation live (MDN, Node.js API, TypeScript Handbook, Next.js docs) rather than guessing signatures.
2. **Dual-Mode Operation**: Dedicated workflows for **Feature Development** (building clean, idiomatic architectures from scratch) and **Code Review** (structured audits using a P0 Blocker → P3 Polish taxonomy with copy-pasteable diffs).
3. **Progressive Disclosure**: A concise, actionable `SKILL.md` supported by a deep `references/` directory containing checklists, design patterns, and anti-pattern catalogs.
4. **Interoperability**: Skills seamlessly reference each other across the stack (e.g. Next.js leveraging TypeScript and JavaScript principles; upcoming Frontend/Backend synthesizers orchestrating the foundation).

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
