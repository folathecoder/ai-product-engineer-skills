# Codebase Discovery & Reconnaissance Checklist

> **Purpose**: A systematic, deterministic protocol for an onboarding engineer or AI agent landing in an unfamiliar codebase to extract architectural topology, dependency graphs, and execution mechanisms in under two minutes.

---

## Phase 1: Workspace Topology & Architecture

- [ ] **Repository Structure**:
  - Is it a **Single Repository (Polyrepo)** or a **Monorepo**?
  - *Monorepo Indicators*:
    - `pnpm-workspace.yaml` (pnpm workspaces)
    - `turbo.json` (Turborepo)
    - `nx.json` (Nx)
    - `lerna.json` (Lerna)
    - Root `package.json` with `"workspaces": [...]`
  - *Directory Layout*: Look for `apps/`, `packages/`, `services/`, `libs/`, `src/`.
- [ ] **Package Manager & Lockfile**:
  - `pnpm-lock.yaml` → `pnpm` (enforces strict non-flat `node_modules`).
  - `package-lock.json` → `npm`.
  - `bun.lock` or `bun.lockb` → `bun`.
  - `yarn.lock` → `yarn` (check if Yarn Berry v2+ via `.yarnrc.yml` or Classic v1).
  - *Rule*: Never mix package managers; always use the one matching the committed lockfile.

---

## Phase 2: Runtime Engine & Tooling Alignment

- [ ] **Node.js / Runtime Version Constraints**:
  - Check `.nvmrc` or `.node-version`.
  - Check `package.json` `"engines"` field (e.g. `"node": ">=22.0.0"`).
  - Check `.tool-versions` (asdf/mise).
  - Check `Dockerfile` or `docker-compose.yml` base image tags (`FROM node:22-alpine`).
- [ ] **TypeScript & Compilation Settings**:
  - Check `tsconfig.json` (root and per-package).
  - Note path aliases (`compilerOptions.paths`), module resolution (`NodeNext` vs `Bundler`), and strictness flags.

---

## Phase 3: Core Tech Stack & Framework Detection

- [ ] **Primary Application Framework**:
  - Next.js (`next` in dependencies → check `app/` vs `pages/`).
  - Vite / React (`vite`, `@vitejs/plugin-react`).
  - NestJS (`@nestjs/core`) or Express (`express`) or Fastify (`fastify`) or Hono (`hono`).
  - Remix / React Router v7 (`@remix-run/react`).
- [ ] **Data Persistence & ORM**:
  - Prisma (`prisma/schema.prisma`).
  - Drizzle (`drizzle.config.ts`, `drizzle/`).
  - TypeORM (`typeorm`, `ormconfig`).
  - Kysely, Mongoose, or raw SQL migrations (`migrations/`).
- [ ] **Authentication & Identity**:
  - NextAuth / Auth.js, Clerk, Supabase Auth, Firebase, Lucia, or custom JWT/session cookies.
- [ ] **State & Data Fetching**:
  - TanStack Query (React Query), SWR, Zustand, Redux Toolkit, Jotai.
- [ ] **UI & Styling Framework**:
  - Tailwind CSS (`tailwind.config.ts`), CSS Modules, Shadcn UI (`components.json`), Radix UI.

---

## Phase 4: Entry Points & Critical Code Paths

- [ ] **Locate Application Entry Points**:
  - Next.js: `app/layout.tsx` + `app/page.tsx` or `pages/_app.tsx`.
  - Frontend SPA: `src/main.tsx` or `src/index.tsx`.
  - Backend API: `src/server.ts`, `src/index.ts`, `src/main.ts`, or `src/app.ts`.
  - Workers / Queues: `src/worker.ts`, `src/jobs/`, or `src/queues/`.
- [ ] **Locate the Data Access Layer (DAL)**:
  - Find where database queries, external HTTP calls, and mutations live (`src/data/`, `src/lib/db`, `src/services/`, `src/repositories/`).
- [ ] **Locate the API Contracts**:
  - Find OpenAPI schemas, tRPC routers (`src/server/routers`), GraphQL schemas (`schema.graphql`), or Route Handlers (`app/api/**/route.ts`).

---

## Phase 5: CI/CD & Quality Guardrails

- [ ] **Continuous Integration Pipelines**:
  - Inspect `.github/workflows/` (or `.gitlab-ci.yml`, `azure-pipelines.yml`).
  - Note the exact commands CI runs: test, lint, typecheck, build, end-to-end (Playwright/Cypress).
- [ ] **Git Hooks & Linters**:
  - Check for Husky (`.husky/`), Lefthook (`lefthook.yml`), Biome (`biome.json`), ESLint (`eslint.config.mjs`), Prettier (`.prettierrc`).
