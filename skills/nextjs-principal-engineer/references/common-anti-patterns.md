# Next.js Anti-Patterns & Canonical Fixes

> **Purpose**: A reference guide of the 25 most common Next.js traps, anti-patterns, and footguns, detailing the failure mode and the idiomatic principal-engineer solution.

---

### 1. Swallowing `redirect()` or `notFound()` in `try/catch`
- **Failure Mode**: In Next.js, `redirect()` and `notFound()` throw internal control-flow exceptions. Catching them in a generic `try/catch` block prevents navigation and silently breaks the application.
- **Fix**: Re-throw the error or use Next.js `isRedirectError` / `unstable_rethrow`:
  ```ts
  import { redirect } from 'next/navigation'
  import { isRedirectError } from 'next/dist/client/components/redirect-error'

  try {
    const data = await mutate()
    redirect('/dashboard')
  } catch (error) {
    if (isRedirectError(error)) throw error
    logger.error(error)
  }
  ```

---

### 2. Synchronous Access to `params` or `cookies()` (Next.js 16)
- **Failure Mode**: Next.js 16 removed synchronous compatibility. Calling `params.id` or `cookies().get(...)` throws an invariant runtime crash.
- **Fix**: Always `await` dynamic APIs:
  ```tsx
  export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const cookieStore = await cookies()
  }
  ```

---

### 3. Blanket `'use client'` on Route Pages or Layouts
- **Failure Mode**: Adding `'use client'` to `page.tsx` or `layout.tsx` forces the entire page, its descendants, and imported utility libraries into the client JavaScript bundle, ruining FCP and INP.
- **Fix**: Keep the page as a Server Component. Extract only the interactive widget into a leaf Client Component:
  ```tsx
  // app/page.tsx (Server Component)
  import { ServerFeed } from './ServerFeed'
  import { InteractiveLikeButton } from './InteractiveLikeButton' // 'use client'

  export default async function Page() {
    return (
      <main>
        <ServerFeed />
        <InteractiveLikeButton />
      </main>
    )
  }
  ```

---

### 4. Reading Runtime APIs Inside `'use cache'`
- **Failure Mode**: Calling `cookies()`, `headers()`, or `searchParams` inside a function or component tagged `'use cache'` triggers error `next-request-in-use-cache`.
- **Fix**: Read request-time data **outside** the cached function and pass values as arguments (which form part of the cache key):
  ```tsx
  // ✅ CORRECT
  async function getCachedFeed(userId: string) {
    'use cache'
    return db.feed.findMany({ where: { userId } })
  }

  export default async function Page() {
    const session = await verifySession()
    const feed = await getCachedFeed(session.userId)
  }
  ```

---

### 5. Missing `default.tsx` in Parallel Route Slots (Next.js 16)
- **Failure Mode**: Next.js 16 requires every `@slot` folder in parallel routes to have an explicit `default.tsx`. Builds fail without it.
- **Fix**: Add `default.tsx` returning `null` or calling `notFound()`:
  ```tsx
  // app/@modal/default.tsx
  export default function Default() {
    return null
  }
  ```

---

### 6. Secrets Leaking to Client Bundles
- **Failure Mode**: Database connection strings, private API keys, or JWT secrets are imported directly or indirectly into client code.
- **Fix**: Add `import 'server-only'` to all internal DAL and database modules. If client import occurs, the build immediately aborts.

---

### 7. Calling `redirect()` Before Revalidation in Server Actions
- **Failure Mode**: `redirect()` throws an error immediately, terminating the action before subsequent lines execute. Placing `revalidatePath` or `updateTag` after `redirect()` leaves cache stale.
- **Fix**: Always invalidate the cache **before** calling `redirect()`:
  ```ts
  'use server'
  import { updateTag } from 'next/cache'
  import { redirect } from 'next/navigation'

  export async function saveItem(id: string) {
    await db.update(id)
    updateTag(`item-${id}`) // ✅ MUST BE BEFORE REDIRECT
    redirect(`/items/${id}`)
  }
  ```

---

### 8. Single-Argument `revalidateTag()` in Next.js 16
- **Failure Mode**: In Next.js 16, `revalidateTag(tag)` without a second argument is deprecated and fails type-checking.
- **Fix**: Provide a `cacheLife` profile as the second argument (e.g. `'max'`):
  ```ts
  import { revalidateTag } from 'next/cache'
  revalidateTag('products', 'max')
  ```

---

### 9. Database Queries or Heavy Crypto in `proxy.ts`
- **Failure Mode**: Performing database calls or heavyweight authentication checks in `proxy.ts` stalls every incoming request and increases latency.
- **Fix**: Use `proxy.ts` strictly for optimistic cookie checks, redirects, rewrites, and header modifications. Enforce cryptographic authentication inside the Data Access Layer.

---

### 10. `ssr: false` in Server Components
- **Failure Mode**: Using `next/dynamic` with `{ ssr: false }` inside a Server Component produces a compile-time error.
- **Fix**: `ssr: false` is only permitted inside Client Components (`'use client'`).

---

### 11. Importing Server Components into Client Components
- **Failure Mode**: Direct import of a Server Component module into a file with `'use client'` automatically converts the imported module into a Client Component, bloating the bundle.
- **Fix**: Pass the Server Component as `children` or a JSX slot from an outer Server Component.

---

### 12. Unvalidated Arguments in Server Actions
- **Failure Mode**: Server Actions are public POST endpoints. Trusting client inputs or spreading raw `FormData` into database queries causes SQL injection, mass assignment, or IDOR vulnerabilities.
- **Fix**: Always parse arguments and `FormData` with a validation schema (e.g. Zod):
  ```ts
  const data = UpdateSchema.parse(Object.fromEntries(formData))
  ```

---

### 13. Missing `priority` on Above-the-Fold LCP Images
- **Failure Mode**: Hero images default to `loading="lazy"`, causing browsers to delay fetching until layout computation, drastically degrading LCP.
- **Fix**: Add `priority={true}` or `preload={true}` to any image in the initial viewport.

---

### 14. Missing `sizes` with `fill` on `next/image`
- **Failure Mode**: Using `<Image fill />` without a `sizes` attribute causes the browser to assume `100vw`, downloading desktop-resolution images on mobile screens.
- **Fix**: Always specify `sizes`:
  ```tsx
  <Image fill sizes="(max-width: 768px) 100vw, 50vw" alt="..." />
  ```

---

### 15. Hydration Inconsistencies from Date / Random Values
- **Failure Mode**: Rendering `new Date().toLocaleTimeString()` or `Math.random()` during server render creates mismatched HTML with client hydration, causing flashing and warnings.
- **Fix**: Synchronize client-side values inside `useEffect` or use `<Suspense>` with `connection()`.

---

### 16. Error Boundary Defined as Server Component
- **Failure Mode**: Forgetting `'use client'` on `error.tsx` or `global-error.tsx`. React Error Boundaries must be Client Components.
- **Fix**: Add `'use client'` at the very top of all `error.tsx` files.

---

### 17. Missing `<html>` and `<body>` in `global-error.tsx`
- **Failure Mode**: `global-error.tsx` replaces the root layout when an error occurs in the root. If it does not provide `<html>` and `<body>`, the browser receives invalid HTML.
- **Fix**: Always define `<html>` and `<body>` tags in `global-error.tsx`.

---

### 18. Compound Component Static Properties Lost Across RSC Boundary
- **Failure Mode**: Exporting `Tabs.List` or `Dropdown.Item` across the server-client boundary fails because static properties on function components do not serialize across RSC boundaries.
- **Fix**: Export sub-components as named exports (`TabsList`, `DropdownItem`).

---

### 19. Using Deprecated `images.domains` Config
- **Failure Mode**: `images.domains` lacks protocol and pathname security. It is deprecated in favor of `images.remotePatterns`.
- **Fix**: Migrate to `images.remotePatterns` in `next.config.ts`.

---

### 20. Sequential Data Fetching Waterfalls in RSC
- **Failure Mode**: Consecutive `await fetch1()`, `await fetch2()`, `await fetch3()` causes cascading latency.
- **Fix**: Use `Promise.all([fetch1(), fetch2(), fetch3()])` or stream them independently via `<Suspense>`.

---

### 21. Forgetting `connection()` for Runtime Environment Variables
- **Failure Mode**: Reading `process.env.DYNAMIC_KEY` inside a prerendered static shell inlines the build-time value, freezing it across deploys.
- **Fix**: Call `await connection()` from `next/server` before reading runtime environment variables.

---

### 22. Throwing Expected Errors in Server Actions
- **Failure Mode**: Throwing errors for form validation failures triggers Error Boundaries, crashing the user's form context.
- **Fix**: Return structured validation states (`{ success: false, errors: {...} }`) and render inline with `useActionState`.

---

### 23. Storing Auth State Exclusively in React Context
- **Failure Mode**: Storing user session only in client-side React Context makes Server Components unaware of user identity, forcing all pages into client-side fetches.
- **Fix**: Read user session on the server in the Data Access Layer (`verifySession()`) and pass data down to components.

---

### 24. Modifying DOM Elements Rendered by Server Components
- **Failure Mode**: Using vanilla JS (`document.getElementById().remove()`) or third-party DOM-manipulating plugins on elements rendered by RSC breaks React hydration and tree reconciliation.
- **Fix**: Keep DOM manipulation inside isolated Client Component subtrees with `useRef`.

---

### 25. Relying on `next lint` in CI
- **Failure Mode**: Next.js 16 removed the `next lint` CLI. Calling `next lint` in CI scripts fails the pipeline.
- **Fix**: Replace `next lint` with direct calls to `eslint .` (ESLint 9+ flat config) or `biome check .`.
