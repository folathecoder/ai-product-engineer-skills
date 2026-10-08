# Deterministic Environment Setup Playbook

> **Purpose**: A step-by-step operational playbook for provisioning a local development environment deterministically without breaking host environments or corrupting dependencies.

---

## Step 1: Runtime Engine Alignment

Always ensure the local runtime matches the project's pinned version before installing packages:

```bash
# Check version requirements
node -v

# If using nvm / fnm / mise
nvm use || fnm use || mise install

# Verify Corepack for pnpm/yarn pinning
corepack enable
```

---

## Step 2: Clean Dependency Installation

**Never** run an arbitrary package manager. Use the tool that matches the committed lockfile:

| Lockfile Present | Required Command | Why |
|---|---|---|
| `pnpm-lock.yaml` | `pnpm install --frozen-lockfile` | Enforces exact lockfile dependencies; avoids lockfile drift. |
| `package-lock.json` | `npm ci` | Clean installation from package-lock; wipes node_modules if needed. |
| `bun.lock` / `bun.lockb` | `bun install --frozen-lockfile` | Fast, deterministic Bun install. |
| `yarn.lock` | `yarn install --immutable` | Enforces committed yarn dependencies. |

---

## Step 3: Environment Configuration Audit

1. **Locate Example Template**: Look for `.env.example`, `.env.template`, or `.env.sample`.
2. **Copy to Active Local Environment**:
   ```bash
   cp .env.example .env.local
   # or
   cp .env.example .env
   ```
3. **Audit Required vs Optional Variables**:
   - Check if variables contain dummy placeholders (e.g. `DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"`).
   - Flag missing external third-party API keys (Stripe, Clerk, AWS, OpenAI) and determine if local mock fallbacks exist.
4. **Inspect Validation Schemas**:
   - Check if the project uses `@t3-oss/env-nextjs` or a Zod-based `src/env.ts`. Running the validation script reveals missing variables immediately.

---

## Step 4: Backing Services & Containers

If the application requires databases, caches, or message brokers:

1. **Inspect `docker-compose.yml`**:
   ```bash
   # Spin up backing services in detached mode
   docker compose up -d
   ```
2. **Common Standard Backing Services**:
   - PostgreSQL / MySQL (Database)
   - Redis (Session cache / background job queues)
   - LocalStack / MinIO (S3 asset mock)
   - Mailpit / MailHog (SMTP email testing)
3. **Port Conflict Check**:
   - If PostgreSQL fails to start: check if a local native Postgres instance is already occupying port 5432 (`lsof -i :5432`).

---

## Step 5: Database Migration & Seeding

Never assume the database schema is current:

```bash
# Prisma
npx prisma generate
npx prisma migrate dev --skip-seed
npx prisma db seed

# Drizzle
npx drizzle-kit migrate
npm run db:seed # if script defined

# Generic / Custom migrations
npm run migrate
npm run seed
```

---

## Step 6: Dev Server Launch & Smoke Test

```bash
# Check package.json scripts for the primary dev command
npm run dev # or pnpm dev, bun dev
```

- Confirm the dev server boots without compilation crashes or missing environment variable errors.
- Confirm the local port (e.g. `http://localhost:3000` or `5173`) returns HTTP 200.
