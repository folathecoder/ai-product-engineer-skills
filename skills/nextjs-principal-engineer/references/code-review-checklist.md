# Principal Next.js Code Review Checklist

> **Purpose**: A comprehensive, severity-ranked checklist used by principal engineers to review Next.js pull requests, identify architectural anti-patterns, prevent security vulnerabilities, and enforce performance excellence.

---

## Severity Classification Framework

| Level | Definition | Merge Policy |
|---|---|---|
| **P0 — Critical** | Security vulnerability, data leak, build-breaking error, or runtime crash. | **BLOCKER**. Must fix immediately before any merge. |
| **P1 — High** | Data inconsistency, race condition, hydration failure, or severe performance regression. | **BLOCKER**. Requires resolution before production release. |
| **P2 — Medium** | Inefficient caching, suboptimal component boundaries, or missing fallback states. | **ACTIONABLE**. Address in current PR or ticketed follow-up. |
| **P3 — Low / Nit** | Code cleanliness, naming consistency, documentation, or minor stylistic polish. | **SUGGESTION**. Non-blocking. |

---

## 1. P0 — Critical (Security, Data Leaks & Runtime Crashes)

### 🚨 Boundary Security & Secret Leaking
- [ ] **No Server Secrets in Client Bundles**: Ensure API keys, private credentials, database URLs, and tokens are never imported into files marked `'use client'`.
  - *Verification*: Verify `server-only` is imported in modules holding sensitive logic: `import 'server-only'`.
  - *Verification*: Check that client-exposed variables use strictly `NEXT_PUBLIC_` and contain no secrets.
- [ ] **Taint APIs Enforced**: Verify `experimental_taintObjectReference` or `experimental_taintUniqueValue` is applied to sensitive user records or session tokens to prevent them from passing over the RSC bridge.
- [ ] **Server Action Authentication & Authorization**: Verify **every** Server Function/Action authenticates and authorizes the caller internally.
  - *Check*: Never trust client-supplied user IDs, roles, or permissions. Always re-fetch session inside the action.
  - *Check*: Actions are exposed as public HTTP POST endpoints. Ensure zero-trust access control.
- [ ] **Input Sanitization & Validation**: Verify all arguments to Server Actions and Route Handlers are parsed with runtime schemas (e.g. Zod, Valibot, ArkType) before execution.
  - *Check*: Validate `FormData` fields explicitly. Never spread unvalidated `formData` directly into database queries.

### 🚨 Routing & Runtime Crashes
- [ ] **Async Request APIs Awaited**: In Next.js 16+, ensure `params`, `searchParams`, `cookies()`, and `headers()` are strictly `await`ed.
  - *Check*: Synchronous property access (`const slug = params.slug`) throws fatal runtime errors.
- [ ] **Parallel Routes Fallback**: In Next.js 16+, every `@slot` folder **must** contain a `default.tsx` file (returning `null` or calling `notFound()`). Build will fail without it.
- [ ] **Root Error Boundary**: Confirm `global-error.tsx` exists in `app/` and contains its own `<html>` and `<body>` tags.
- [ ] **No Uncaught Control Flow Exceptions**: `redirect()` and `notFound()` throw internal React control-flow errors. Ensure they are **never swallowed** in generic `try/catch` blocks:
  ```ts
  try {
    // ...
  } catch (error) {
    // ❌ WRONG: Swallows redirect
    // ✅ CORRECT: if (isRedirectError(error)) throw error;
  }
  ```

---

## 2. P1 — High (Correctness, Hydration & Data Integrity)

### ⚙️ Server vs. Client Boundary Discipline
- [ ] **Push `'use client'` to the Leaves**: Verify `'use client'` is not placed at the page or layout root unnecessarily. Keep data fetching and heavy logic in Server Components.
- [ ] **Pass Server Components as Slots/Children**: When a Client Component needs to render Server Components, ensure it accepts `children` or JSX props rather than importing the Server Component directly.
- [ ] **Props Across the Boundary Are Serializable**: Verify no functions, class instances, Symbols, or non-serializable objects are passed as props from Server to Client Components.
- [ ] **Hydration Discrepancy Prevention**:
  - *Check*: Avoid rendering browser-specific timestamps (`new Date().toLocaleTimeString()`) or `window` values during SSR.
  - *Check*: Use `useEffect` or `suppressHydrationWarning` on root `<html>` for theme classes.

### 🔄 Mutations & Cache Synchronization
- [ ] **Read-Your-Writes vs. SWR Matching**:
  - *Server Actions (User Forms/Settings)*: Use `updateTag(tag)` for immediate cache expiration so the user sees their change instantly.
  - *Background Updates / Catalogs*: Use `revalidateTag(tag, 'max')` for background stale-while-revalidate behavior.
- [ ] **Server Action Return Values vs. Throws**:
  - *Expected Errors* (validation, unauthorized, business logic) must be returned as data (`{ success: false, error: '...' }`) and consumed via `useActionState`.
  - Only uncaught system bugs should `throw`.
- [ ] **Revalidation Before Redirect**: In Server Actions, ensure cache invalidation (`updateTag` / `revalidatePath`) happens **before** `redirect()`, because `redirect()` aborts function execution immediately.

---

## 3. P2 — Medium (Performance, Caching & Web Vitals)

### ⚡ Caching & Partial Prerendering (PPR)
- [ ] **Explicit Caching via Cache Components**: With `cacheComponents: true`, verify functions that fetch expensive, shared data are explicitly tagged with `'use cache'` and an appropriate `cacheLife()` profile.
- [ ] **No Request-Time APIs in Cache Scopes**: Verify functions marked with `'use cache'` do **not** invoke `cookies()`, `headers()`, or `searchParams`. Pass dynamic values into the cached function as arguments.
- [ ] **Push Dynamic Work Below Suspense**: To maximize the static shell in PPR, ensure `await cookies()` or dynamic DB calls are pushed as deep as possible into leaf components wrapped in `<Suspense fallback={<Skeleton />}>`.
- [ ] **Static Shell Verification**: Verify layouts and high-level page wrappers do not block rendering on uncached request-time APIs.

### 🖼️ Core Web Vitals & Media Optimization
- [ ] **LCP Image Preload & Priority**:
  - The hero/LCP image **must** have `priority={true}` or `preload={true}` and omit `loading="lazy"`.
  - Provide accurate `sizes` attribute when using `fill` to avoid downloading oversized desktop assets on mobile.
- [ ] **Cumulative Layout Shift (CLS) Prevention**:
  - Images must specify explicit `width` and `height`, or use `fill` inside a container with fixed aspect ratio.
  - Skeletons in `<Suspense fallback={...}>` and `loading.tsx` must match the dimensions and layout of the incoming content.
- [ ] **Font Optimization**: Use `next/font/google` or `next/font/local` with `subsets` and CSS variables to eliminate layout shifts caused by external web fonts.
- [ ] **Script Loading Strategy**: Use `next/script` with appropriate strategies (`afterInteractive`, `lazyOnload`). Note: `strategy="worker"` is experimental and does not support App Router.

---

## 4. P3 — Low / Polish (Architecture, Hygiene & Cleanliness)

### 🧹 Architecture & Structure
- [ ] **Colocation with Private Folders**: Group feature-specific components, hooks, and tests in `_components/` or `_lib/` folders within the route directory.
- [ ] **Route Handlers vs. Server Actions Division**: Ensure `route.ts` is only used for external APIs, webhooks, or non-POST verbs. Internal UI mutations should use Server Actions.
- [ ] **Proxy Discipline**: Verify `proxy.ts` does **not** execute heavy database queries or full session verification. Proxy must only handle lightweight optimistic cookie checks, redirects, rewrites, and header modifications.
- [ ] **Package Bundling Optimization**: Check `next.config.ts` for `optimizePackageImports` on large UI or icon libraries (e.g. `lucide-react`, `@radix-ui/react-icons`) to prevent bundle bloat.
