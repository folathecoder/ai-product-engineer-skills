# Next.js Architecture & Design Patterns

> **Purpose**: Idiomatic, enterprise-grade architecture patterns for full-stack Next.js applications, covering the Data Access Layer (DAL), server/client boundaries, authentication, form management, and project layout.

---

## 1. The Data Access Layer (DAL) Pattern

In modern Next.js, direct database calls or external API queries should **never** be scattered haphazardly across components. Instead, isolate data fetching into a dedicated Data Access Layer.

### Core Principles
1. **Enforce Server Execution**: Every DAL module must import `server-only`. If imported into a Client Component, the build immediately halts.
2. **Per-Request Memoization**: Wrap queries in React `cache()` to deduplicate identical calls within the same server render pass.
3. **Session Verification at the Query Level**: Authorize data access inside the data function, not exclusively at the route or proxy level.
4. **Data Transfer Objects (DTOs)**: Sanitize returned data to prevent leaking internal database IDs, hashes, or sensitive fields over the RSC wire.

### Canonical DAL Implementation

```ts
// src/data/dal.ts
import 'server-only'
import { cookies } from 'next/headers'
import { cache } from 'react'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'

/**
 * Verify session and extract user identity.
 * Memoized per request using React cache().
 */
export const verifySession = cache(async () => {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_session')?.value

  if (!token) {
    redirect('/login')
  }

  const session = await db.sessions.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date()) {
    redirect('/login')
  }

  return { isAuth: true, userId: session.userId, role: session.user.role }
})

/**
 * Fetch sensitive user profile with strict authorization.
 */
export const getUserProfile = cache(async (targetUserId: string) => {
  const session = await verifySession()

  // Authorization check
  if (session.userId !== targetUserId && session.role !== 'ADMIN') {
    throw new Error('Unauthorized: Forbidden access to user record')
  }

  const user = await db.users.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      // Excludes passwordHash, resetTokens, stripeCustomerId
    },
  })

  return user
})
```

---

## 2. Server & Client Component Composition Patterns

### Mental Model: Owner vs. Parent
- **Owner**: The component whose JSX source code creates the element.
- **Parent**: The component that receives and renders the element in its tree.
- When a Server Component creates a JSX element and passes it as `children` or a slot to a Client Component, that element is **rendered on the server**. Its JavaScript code is **not** added to the client bundle.

### Pattern A: The Interleaving Slot Pattern
Never import a Server Component into a Client Component file. Instead, use composition:

```tsx
// ❌ ANTI-PATTERN: Client Component importing Server Component
// app/ui/ClientModal.tsx
'use client'
import ServerDataList from './ServerDataList' // ⚠️ Forces ServerDataList to compile as Client Component!

export function ClientModal() {
  return <div className="modal"><ServerDataList /></div>
}

// ✅ IDIOMATIC: Pass Server Component via children
// app/ui/ClientModal.tsx
'use client'
import { useState } from 'react'

export function ClientModal({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  if (!isOpen) return <button onClick={() => setIsOpen(true)}>Open</button>
  return (
    <div className="modal">
      <button onClick={() => setIsOpen(false)}>Close</button>
      {children}
    </div>
  )
}

// app/dashboard/page.tsx (Server Component)
import { ClientModal } from '@/app/ui/ClientModal'
import { ServerDataList } from '@/app/ui/ServerDataList'

export default async function Page() {
  return (
    <ClientModal>
      <ServerDataList /> {/* Rendered on server, passed as JSX prop */}
    </ClientModal>
  )
}
```

### Pattern B: Third-Party Client Component Wrappers
When using component libraries that require browser APIs or React context but omit the `'use client'` directive:

```tsx
// src/components/ui/carousel.tsx
'use client'

// Wrap external library in a dedicated leaf file
export { Carousel, CarouselItem } from 'external-carousel-lib'
```

---

## 3. Authentication & Authorization Architecture

A secure Next.js architecture relies on a **defense-in-depth** model across three distinct layers:

```
[ Incoming Request ]
        │
        ▼
1. Proxy (`proxy.ts`) ───────► Optimistic Cookie Check, Fast Redirect, CSP Nonce
        │
        ▼
2. Layouts / Pages ──────────► Route-level Suspense, App Shell rendering
        │
        ▼
3. DAL & Server Actions ─────► Cryptographic Session Verification, Fine-Grained Authorization
```

### Layer 1: Proxy (`proxy.ts`)
- **Responsibility**: Lightweight edge-like routing, optimistic cookie presence checks, CSP header injection.
- **Strict Limitation**: Never query databases or run expensive auth verification in Proxy. It should only inspect headers/cookies and redirect unauthenticated users to `/login`.

### Layer 2: Layouts & Pages
- Layouts do **not** re-render on navigation.
- Never rely solely on layout-level checks for page security. If a subpage needs protection, verify authorization at the subpage or DAL level.

### Layer 3: Server Actions & DAL (The Source of Truth)
- Every Server Action must independently verify identity and permissions before mutating state.
- Treat every Server Action as a publicly addressable POST endpoint.

---

## 4. Modern Form & Mutation Architecture (React 19 + Next.js 16)

### Server Action with `useActionState` and `updateTag`

```tsx
// app/actions/update-profile.ts
'use server'

import { z } from 'zod'
import { updateTag } from 'next/cache'
import { verifySession } from '@/data/dal'
import { db } from '@/lib/db'

const ProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(200, 'Bio cannot exceed 200 characters'),
})

export type FormState = {
  success?: boolean
  errors?: Record<string, string[]>
  message?: string
}

export async function updateProfileAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const session = await verifySession()

  // 1. Validate Input
  const validated = ProfileSchema.safeParse({
    name: formData.get('name'),
    bio: formData.get('bio'),
  })

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    }
  }

  try {
    // 2. Perform Mutation
    await db.users.update({
      where: { id: session.userId },
      data: validated.data,
    })

    // 3. Read-your-writes Cache Expiration (Next.js 16+)
    updateTag(`user-${session.userId}`)

    return { success: true, message: 'Profile updated successfully.' }
  } catch (error) {
    return { success: false, message: 'An unexpected database error occurred.' }
  }
}
```

```tsx
// app/ui/ProfileForm.tsx
'use client'

import { useActionState, useOptimistic } from 'react'
import { updateProfileAction, type FormState } from '@/app/actions/update-profile'

export function ProfileForm({ initialName, initialBio }: { initialName: string, initialBio: string }) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, {})

  // React 19 Optimistic UI
  const [optimisticName, setOptimisticName] = useOptimistic(
    initialName,
    (_current, newName: string) => newName
  )

  return (
    <form
      action={async (formData) => {
        const newName = formData.get('name') as string
        setOptimisticName(newName)
        await formAction(formData)
      }}
    >
      <h2>Editing: {optimisticName}</h2>
      <div>
        <label htmlFor="name">Name</label>
        <input id="name" name="name" defaultValue={initialName} required />
        {state.errors?.name && <p className="error">{state.errors.name[0]}</p>}
      </div>

      <div>
        <label htmlFor="bio">Bio</label>
        <textarea id="bio" name="bio" defaultValue={initialBio} />
        {state.errors?.bio && <p className="error">{state.errors.bio[0]}</p>}
      </div>

      {state.message && <p aria-live="polite">{state.message}</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  )
}
```

---

## 5. Architectural Decision Matrix: Server Actions vs. Route Handlers

| Requirement | Preferred Mechanism | Rationale |
|---|---|---|
| User-initiated form submission / UI mutation | **Server Action** | Integrated with React transitions, optimistic updates, automatic CSRF tokens, and read-your-writes cache invalidation. |
| External Webhooks (Stripe, GitHub) | **Route Handler** (`route.ts`) | Receives arbitrary HTTP headers, raw request bodies, and custom signature verification. |
| Binary file download or export (PDF, CSV) | **Route Handler** (`route.ts`) | Returns custom `Response` streams with bespoke `Content-Type` headers. |
| Public REST or GraphQL API for external clients | **Route Handler** (`route.ts`) | Standard REST verbs (`GET`, `PUT`, `DELETE`), API key / OAuth token headers. |
| Optimistic interactive item deletion | **Server Action** | Seamlessly updates client UI state via `useOptimistic` and triggers server-side `updateTag`. |
