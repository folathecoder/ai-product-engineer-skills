# Modern Frontend State Architecture & Data Synchronization

> **Purpose**: Authoritative reference for architecting predictable, high-performance client state across the 4 state quadrants: Server State, Client State, URL State, and Local Transient State.

---

## 1. The 4 Quadrants of Frontend State

Never treat all application state uniformly. Segregate data into its rightful quadrant:

```
                      ┌────────────────────────────────────────┐
                      │              SERVER STATE              │
                      │  Remote, asynchronous, shared, cached  │
                      │  Tooling: React Server Components,     │
                      │  TanStack Query, SWR                   │
                      └──────────────────┬─────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
┌───────────────────────┐  ┌───────────────────────────┐  ┌───────────────────────┐
│     CLIENT STATE      │  │         URL STATE         │  │      LOCAL STATE      │
│ Global UI, user theme,│  │ Shareable, bookmarkable   │  │ Ephemeral inputs,     │
│ multi-step wizard     │  │ filters, pagination, tabs │  │ modals, hover flags   │
│ Tooling: Zustand,     │  │ Tooling: Search Params,   │  │ Tooling: useState,    │
│ Jotai, Context        │  │ `nuqs`, router push       │  │ useReducer            │
└───────────────────────┘  └───────────────────────────┘  └───────────────────────┘
```

---

## 2. The Cardinal Sin: Syncing Server State via `useEffect`

### Anti-Pattern: Local State Mirroring
Copying remote data into local `useState` inside a `useEffect` introduces out-of-sync race conditions, stale closures, and redundant re-render cascades:

```tsx
// ❌ ANTI-PATTERN: Mirroring server state in local state
function UserProfile({ userId }: { userId: string }) {
  const [data, setData] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUser(userId).then((res) => {
      setData(res)
      setLoading(false)
    })
  }, [userId]) // Prone to race conditions on rapid userId changes!
}
```

### Idiomatic Solution: Server-Driven or Query Cache
Use React Server Components directly (if full-stack) or a dedicated server-state manager (TanStack Query / SWR) which automatically handles deduplication, caching, background refetching, and window focus revalidation:

```tsx
// ✅ IDIOMATIC: TanStack Query manages lifecycle and deduplication
import { useQuery } from '@tanstack/react-query'

function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 1000 * 60 * 5, // 5 minutes fresh
  })

  if (isLoading) return <ProfileSkeleton />
  if (error) return <ErrorMessage error={error} />
  return <ProfileCard user={user} />
}
```

---

## 3. URL as the Source of Truth (URL State)

Any state that a user expects to share, refresh, or bookmark (e.g. search filters, active tabs, pagination offset, sorting column) **belongs in the URL query string**, not in memory.

### Pattern: Typed Search Params (`nuqs` / React Router)
```tsx
import { useQueryState, parseAsString, parseAsInteger } from 'nuqs'

export function ProductCatalog() {
  const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''))
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))

  return (
    <div>
      <SearchInput value={search} onChange={(val) => { setSearch(val); setPage(1); }} />
      <ProductGrid query={search} page={page} />
      <Pagination page={page} onPageChange={setPage} />
    </div>
  )
}
```

---

## 4. Global Client State with Zustand

When client-only cross-component state is necessary (e.g. sidebar open state, shopping cart drawer, audio player state), use **Zustand** with atomic selectors to prevent unnecessary re-renders:

```ts
// src/stores/ui-store.ts
import { create } from 'zustand'

interface UIState {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),
}))

// Usage in Component (Atomic Selector guarantees only isSidebarOpen changes trigger re-render)
export function SidebarToggle() {
  const toggle = useUIStore((state) => state.toggleSidebar)
  return <button onClick={toggle}>Toggle Menu</button>
}
```

---

## 5. Optimistic UI with Immediate Rollback

When a user performs an interactive action (liking a post, toggling a checkbox), update the UI immediately and roll back if the server mutation fails:

```ts
const queryClient = useQueryClient()

const mutation = useMutation({
  mutationFn: toggleFavoriteApi,
  onMutate: async (newStatus) => {
    // 1. Cancel in-flight refetches so they don't overwrite optimistic update
    await queryClient.cancelQueries({ queryKey: ['favorites', itemId] })

    // 2. Snapshot previous value for rollback
    const previousStatus = queryClient.getQueryData(['favorites', itemId])

    // 3. Optimistically update cache
    queryClient.setQueryData(['favorites', itemId], newStatus)

    return { previousStatus }
  },
  onError: (err, newStatus, context) => {
    // 4. Rollback on failure
    if (context?.previousStatus !== undefined) {
      queryClient.setQueryData(['favorites', itemId], context.previousStatus)
    }
  },
  onSettled: () => {
    // 5. Invalidate to sync authoritative server state
    queryClient.invalidateQueries({ queryKey: ['favorites', itemId] })
  },
})
```
