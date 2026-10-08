# Top Onboarding Traps & Tribal Knowledge Gotchas

> **Purpose**: A troubleshooting catalog of the 20 most frequent stumbling blocks, traps, and tribal knowledge gotchas that derail engineers and AI agents when onboarding onto an existing codebase.

---

### 1. Mismatched Node Engine Version
- **Trap**: Running Node.js 18 or 20 when the project depends on Node 22+ native features (e.g. `node:sqlite`, type stripping, ES2024 primitives). Results in mysterious syntax crashes or missing module errors.
- **Solution**: Always check `.nvmrc`, `.node-version`, or `package.json#engines` first. Run `nvm use` or `fnm use`.

---

### 2. Lockfile Corruption (Wrong Package Manager)
- **Trap**: Running `npm install` inside a repository that uses `pnpm` or `yarn`, generating a competing lockfile and corrupting dependency trees.
- **Solution**: Check for `pnpm-lock.yaml` or `yarn.lock` first. Always run `corepack enable` and use the matching package manager with `--frozen-lockfile` or `npm ci`.

---

### 3. Out-of-Sync Generated ORM Clients (e.g. Prisma Client)
- **Trap**: Cloning the repo and running `npm run dev` yields `PrismaClientInitializationError: @prisma/client did not initialize yet`.
- **Solution**: Modern ORMs require code generation after install: run `npx prisma generate` or `npx drizzle-kit generate`.

---

### 4. Database Connection Refused (Unstarted Docker)
- **Trap**: Dev server immediately crashes with `ECONNREFUSED 127.0.0.1:5432`.
- **Solution**: Check if a `docker-compose.yml` exists. Run `docker compose up -d` to boot local PostgreSQL/Redis backing services.

---

### 5. Missing Migrations & Empty Database State
- **Trap**: Database is running, but queries fail with `Table "users" does not exist` or pages render blank.
- **Solution**: Run pending migrations (`npx prisma migrate dev` / `npm run migrate`) followed by the seed script (`npm run seed`).

---

### 6. Local Port Collisions
- **Trap**: The project expects port 3000, 5432, or 6379, but an orphaned background process is occupying it. Next.js silently falls back to 3001, breaking OAuth redirects configured for 3000.
- **Solution**: Identify the process using `lsof -i :3000` or `lsof -i :5432` and kill it (`kill -9 <PID>`).

---

### 7. Forgetting `.env.local`
- **Trap**: Environment variables are undefined because `.env.example` was never copied to `.env` or `.env.local`.
- **Solution**: Copy `.env.example` to `.env.local` and populate minimal required local values.

---

### 8. Phantom Monorepo Dependencies (Phantom Imports)
- **Trap**: An application imports a package that works on one developer's machine because it was hoisted to root `node_modules`, but fails in CI or for other package managers (pnpm).
- **Solution**: Ensure every package explicitly declares its dependencies in its own local `package.json`.

---

### 9. Git Hooks Failing Silently or Blocking Commits
- **Trap**: Husky or Lefthook fails during `git commit` due to local permission errors or formatting failures.
- **Solution**: Inspect `.husky/` or `lefthook.yml`. Run `npm run format` or `npx husky install`.

---

### 10. Timezone & Locale Flaky Tests
- **Trap**: Tests pass in CI (UTC) but fail on a developer's local machine due to local system timezone differences.
- **Solution**: Run tests with `TZ=UTC npm test`.
