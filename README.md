# AI Product Engineer Skills

A curated repository of production-grade, authoritative AI agent skills designed for modern software development, architecture, and code review.

Each skill in this repository is built to turn any AI coding agent into a principal-level domain specialist, equipped with deep mechanical sympathy for the underlying frameworks, strict safety and boundary discipline, and live-documentation verification protocols to prevent obsolescence.

---

## Available Skills

| Skill | Focus | Target Versions | Description |
|---|---|---|---|
| [`nextjs-principal-engineer`](./skills/nextjs-principal-engineer/) | Full-Stack Architecture, Development & Code Review | Next.js 14, 15, 16+ (React 19+) | Transforms any AI agent into a principal Next.js & React engineer. Covers App Router, Cache Components (`use cache`), Partial Prerendering (PPR), Server Actions, Data Access Layer (DAL), zero-trust security, Core Web Vitals, and P0–P3 severity-ranked code reviews. |

---

## Skill Spotlight: `nextjs-principal-engineer`

Located in [`skills/nextjs-principal-engineer/`](./skills/nextjs-principal-engineer/).

### What It Does
- **Pre-Flight Version & Docs Protocol**: Inspects `package.json` to identify exact Next.js and React versions. Queries official Next.js documentation live via `llms.txt` and `.md` endpoints whenever an API is unfamiliar or newer than Next.js 16.4, ensuring the skill never gets outdated.
- **Server Components Discipline**: Enforces Server Components by default, pushing `'use client'` strictly to leaf nodes and preventing client bundle bloat.
- **Next.js 16 Architecture**: Built for the latest paradigms including Cache Components (`cacheComponents: true`), `'use cache'`, `cacheLife()`, `updateTag()` (read-your-writes), `revalidateTag(tag, profile)`, and the Node.js `proxy.ts` network boundary.
- **Zero-Trust Security**: Implements the Data Access Layer (DAL) pattern with `import 'server-only'`, React Taint APIs, and strict authorization on every Server Action.
- **Core Web Vitals Obsession**: Enforces LCP < 2.5s, CLS < 0.1, and INP < 200ms through streaming Suspense boundaries, `next/image` security defaults, and `next/font` zero-CLS variable loading.
- **Severity-Ranked Code Reviews**: Delivers structured pull request audits using a battle-tested P0 (Critical/Blocker) through P3 (Nit) taxonomy with copy-pasteable diffs.

### Reference Library Bundled with the Skill
- [`references/version-matrix.md`](./skills/nextjs-principal-engineer/references/version-matrix.md): Invariant mapping across Next.js 14, 15, 16+, breaking changes, and live docs endpoints.
- [`references/code-review-checklist.md`](./skills/nextjs-principal-engineer/references/code-review-checklist.md): Comprehensive checklist categorized by severity.
- [`references/architecture-patterns.md`](./skills/nextjs-principal-engineer/references/architecture-patterns.md): DAL implementation, boundary slot patterns, authentication, and React 19 forms.
- [`references/caching-and-data-fetching.md`](./skills/nextjs-principal-engineer/references/caching-and-data-fetching.md): Cache Components, `'use cache'`, profiles, and tag invalidation matrix.
- [`references/performance-and-vitals.md`](./skills/nextjs-principal-engineer/references/performance-and-vitals.md): Streaming HTTP, Turbopack analysis, and media optimization.
- [`references/common-anti-patterns.md`](./skills/nextjs-principal-engineer/references/common-anti-patterns.md): The top 25 Next.js traps and canonical fixes.

---

## Installation & Usage in OpenCode

### User-Level (Global across all projects)
Copy the skill folder into your OpenCode configuration directory:

```bash
mkdir -p ~/.config/opencode/skills/nextjs-principal-engineer
cp -R skills/nextjs-principal-engineer/* ~/.config/opencode/skills/nextjs-principal-engineer/
```

OpenCode will automatically discover the skill and make it available in your session:
```markdown
<available_skills>
  <skill>
    <id>nextjs-principal-engineer</id>
    <name>nextjs-principal-engineer</name>
  </skill>
</available_skills>
```

### Project-Level
To scope a skill to a specific repository, place it inside `.opencode/skills/`:

```bash
mkdir -p .opencode/skills/nextjs-principal-engineer
cp -R path/to/skills/nextjs-principal-engineer/* .opencode/skills/nextjs-principal-engineer/
```

---

## License

[MIT](./LICENSE)
