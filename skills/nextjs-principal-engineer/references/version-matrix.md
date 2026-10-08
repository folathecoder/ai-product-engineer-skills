# Next.js Version Matrix & Evolution Guide

> **Rule for Agents**: Never assume a single Next.js version. Always inspect `package.json` first. If the project version is newer than this guide or if you are uncertain of an API signature, query the official documentation live at `https://nextjs.org/docs/<path>.md` or `https://nextjs.org/docs/<version>/...`.

---

## 1. Quick Version Identifier & Feature Detection

| Architectural Area | Next.js 14 | Next.js 15 | Next.js 16+ (Current) | Future (17+) |
|---|---|---|---|---|
| **React Foundation** | React 18 | React 19 (RC / GA) | React 19.2+ (Canary built-in) | React 20+ |
| **Bundler Default** | Webpack (Turbopack opt-in dev) | Webpack / Turbopack dev stable | **Turbopack default** (dev & build) | Turbopack only |
| **Request APIs (`params`, `cookies`, etc.)** | **Synchronous** | Async transition (sync deprecated) | **Mandatory Asynchronous** (`await`) | Mandatory Asynchronous |
| **Caching Model** | Implicit aggressive `fetch` cache | Uncached `fetch` default, `unstable_cache` | **Cache Components** (`use cache`, `cacheLife`) | Cache Components standard |
| **PPR (Partial Prerendering)** | Experimental early preview | `experimental.ppr = true` | Built into Cache Components & static shell | Universal default |
| **Request Interception** | `middleware.ts` (Edge runtime) | `middleware.ts` (Node/Edge) | **`proxy.ts`** (strictly Node.js runtime) | `proxy.ts` |
| **Mutation Syncing** | `revalidatePath`, `revalidateTag(tag)` | `revalidateTag(tag)`, `after()` | **`updateTag(tag)`** + `revalidateTag(tag, profile)` + `refresh()` | Fine-grained revalidation |
| **Image Component** | `domains`, `minimumCacheTTL: 60s` | `remotePatterns`, `domains` deprecated | 4h TTL default, `qualities: [75]`, local query config | Strict security defaults |
| **Linting CLI** | `next lint` built-in | `next lint` deprecation warning | **`next lint` removed** (direct ESLint/Biome) | ESLint flat config / Biome |

---

## 2. Next.js 16+ Deep Dive (Current Standard)

### Mandatory Async Request APIs
Synchronous access to dynamic parameters and headers is **completely removed**. Calling them without `await` throws an invariant runtime error.

```tsx
// ❌ FAILS in Next.js 16
export default function Page({ params, searchParams }: { params: { slug: string }, searchParams: { q: string } }) {
  const { slug } = params // ERROR
  const cookie = cookies().get('token') // ERROR
}

// ✅ REQUIRED in Next.js 16
import { cookies, headers } from 'next/headers'

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { slug } = await params
  const { q } = await searchParams
  const cookieStore = await cookies()
  const headerStore = await headers()
}
```

#### TypeScript Helper Types
Next.js 15.5+ and 16 provide global type helpers generated during `next dev`, `next build`, or `npx next typegen`:
- `PageProps<'/route/[param]'>`
- `LayoutProps<'/route/[param]'>`
- `RouteContext<'/api/route/[param]'>`

### Cache Components & The New Caching Architecture
- Configuration: `cacheComponents: true` in `next.config.ts`.
- `fetch()` requests are **never cached implicitly**.
- Caching is declared using the `'use cache'` directive on files, components, or functions.
- Every function marked `'use cache'` **must be async**.
- Stabilized APIs: `cacheLife()` and `cacheTag()` (the `unstable_` prefix is deprecated).
- Built-in `cacheLife` profiles: `'default'`, `'seconds'`, `'minutes'`, `'hours'`, `'days'`, `'weeks'`, `'max'`.
- Tag invalidation signatures:
  - `updateTag(tag)`: Server Actions only; immediate **read-your-writes** consistency.
  - `revalidateTag(tag, profile)`: Background SWR; requires second argument (`'max'` recommended). Single-arg form is deprecated.
  - `refresh()`: Server Actions only; re-renders uncached UI without modifying cache entries.

### The `proxy.ts` Network Boundary
- Replaces `middleware.ts` to clarify its role as a network reverse-proxy.
- Strictly runs on the **Node.js runtime** (`edge` runtime is not supported in `proxy.ts`).
- Location: Root directory or `src/proxy.ts`.
- File export: Named export `proxy` or default export.
- Matcher config syntax remains identical.
- Flag rename: `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`.

### Turbopack as Default Bundler
- `next dev` and `next build` use Turbopack automatically.
- Passing custom `webpack` configurations causes the build to fail unless `--webpack` flag is supplied.
- Configuration resides under top-level `turbopack` in `next.config.ts`.

### `next/image` Breaking Changes
- `minimumCacheTTL`: Default increased from 60 seconds to **4 hours** (14,400s).
- `qualities`: Default constrained to `[75]`. Any unlisted quality is coerced.
- `imageSizes`: Value `16` removed from default array.
- Local images containing query strings require explicit pattern matching in `images.localPatterns`.
- `images.dangerouslyAllowLocalIP`: Default `false` to prevent internal network SSRF.
- Maximum redirects reduced from unlimited to `3`.

---

## 3. Next.js 15 Reference (Maintenance LTS)

- Async request APIs were introduced with backward-compatible sync warnings (`UnsafeUnwrapped`).
- `after()` API introduced for secondary tasks executed after response completion.
- React 19 GA / RC integration.
- `experimental.ppr = true` for Partial Prerendering.
- `experimental.dynamicIO = true` and `experimental.useCache = true` (precursors to `cacheComponents`).
- `middleware.ts` supported both Edge and Node runtimes.

---

## 4. Next.js 14 Reference (Legacy Support)

- Implicit aggressive caching: `fetch()` cached by default unless `{ cache: 'no-store' }`.
- Route segment configurations controlled behavior:
  - `export const dynamic = 'auto' | 'force-dynamic' | 'error' | 'force-static'`
  - `export const revalidate = 0 | 60 | false`
- `params` and `searchParams` were synchronous objects.
- `cookies()` and `headers()` were synchronous calls.
- `unstable_cache()` and `unstable_noStore()` were used for function-level cache control.
- `next lint` was standard.

---

## 5. Live Docs Verification Protocol for Agents (Never Get Outdated)

When working on a Next.js codebase, **never guess an API signature** if the version is newer than Next.js 16.4 or if you receive unfamiliar compilation warnings. Follow this dynamic protocol:

### Step 1: Detect Project Version & Router
Check `package.json`:
```json
"dependencies": {
  "next": "^16.4.0",
  "react": "^19.2.0"
}
```
Check directory tree:
- Presence of `app/` → App Router.
- Presence of `pages/` → Pages Router.

### Step 2: Fetch Version-Matched Documentation
Use `webfetch` to query official Next.js Markdown endpoints:
1. **Full LLM Index**: `https://nextjs.org/docs/llms.txt`
2. **Current Version Canonical Doc**: `https://nextjs.org/docs/app/<section>/<topic>.md`
   *(Example: `https://nextjs.org/docs/app/api-reference/functions/cacheLife.md`)*
3. **Specific Major Version Docs**: `https://nextjs.org/docs/<version>/app/<section>/<topic>.md`
   *(Example: `https://nextjs.org/docs/15/app/getting-started/fetching-data.md`)*
4. **Upgrade & Migration Guides**: `https://nextjs.org/docs/app/guides/upgrading/version-<target>.md`
5. **Local In-Repo Docs**: Check `node_modules/next/dist/docs/` or `AGENTS.md` if configured in the project.

### Step 3: Verify Breaking Changes & Deprecations
If Next.js logs deprecation notices in terminal output or build errors, immediately fetch the referenced `nextjs.org/docs/messages/<error-slug>` URL or the upgrade guide for that version.
