# Architecture & Data Flow Mapping Guide

> **Purpose**: A methodology for reverse-engineering the architectural layers, data flows, and external integrations of an unfamiliar codebase to construct an accurate mental model in minutes.

---

## 1. The 4-Tier Architectural Model

When dissecting any modern web or backend codebase, map components to these four distinct tiers:

```
┌────────────────────────────────────────────────────────┐
│ 1. Presentation & Routing Tier                         │
│    App Router (page.tsx), Vite SPA, UI Components      │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ 2. Orchestration & Transport Tier                      │
│    Route Handlers, Server Actions, tRPC, Controllers   │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ 3. Domain & Data Access Tier (DAL)                     │
│    Business Services, Repositories, Domain Models      │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ 4. Persistence & External Systems Tier                 │
│    PostgreSQL, Redis, Stripe, AWS S3, Auth Provider    │
└────────────────────────────────────────────────────────┘
```

---

## 2. Tracing an End-to-End User Request

Pick a single representative feature (e.g., "Create a Project" or "Update Profile") and trace its execution:

1. **User Action / Route**: Locate the form or button in the UI (`src/components/ProjectForm.tsx`).
2. **Transport Boundary**: Identify how data crosses to the server:
   - Next.js Server Action (`app/actions/project.ts`).
   - HTTP Fetch to REST API endpoint (`POST /api/projects` in `app/api/projects/route.ts`).
   - tRPC mutation (`trpc.project.create.useMutation()`).
3. **Input Validation**: Locate the schema validating payload arguments (e.g. Zod schema in `src/schemas/project.ts`).
4. **Authorization & Session**: Find how user identity is verified (e.g. `const session = await auth()`).
5. **Business Logic & Persistence**: Follow the call to the ORM query (e.g. `await db.project.create(...)`).
6. **Side Effects & Caching**: Check if cache tags are revalidated or background jobs enqueued.

---

## 3. Background Processing & Asynchronous Jobs

Identify if the system uses asynchronous job processors:
- **Queue Engines**: BullMQ, Celery, RabbitMQ, SQS, pg-boss.
- **Serverless Event Workflows**: Inngest, Trigger.dev, Temporal.
- **Scheduled Tasks / Cron**: `cron` jobs, Vercel Cron (`vercel.json`), node-cron.

---

## 4. Reverse-Engineered Architecture Document Template

When onboarding a new engineer, output the architecture summary using this standardized layout:

```markdown
# 🏛️ Architecture Overview: [Project Name]

### 1. High-Level Topology
- **Type**: [Modular Monolith | Monorepo (pnpm/Turborepo) | Next.js Fullstack | Split API + SPA]
- **Frontend**: [Next.js App Router | React Vite | Tailwind CSS]
- **Backend / API**: [Next.js Route Handlers | Node.js Express | tRPC]
- **Database / Cache**: [PostgreSQL via Prisma | Redis]

### 2. Request Lifecycle & Boundaries
- **Entrypoint**: `app/page.tsx` / `src/server.ts`
- **Authentication**: [Cookie-based sessions via Auth.js | JWT in Authorization header]
- **Data Access Layer**: Located in `src/data/` or `src/services/` with `server-only`
- **Mutations**: [Server Actions with Zod validation and updateTag invalidation]

### 3. Key Third-Party Integrations
- Payments: Stripe (webhooks in `app/api/webhooks/stripe/route.ts`)
- Storage: AWS S3 / Cloudflare R2
- Emails: Resend / Postmark
```
