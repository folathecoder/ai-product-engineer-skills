# Browser Runtime Performance & Web Vitals Engineering

> **Purpose**: Technical playbook for mastering the Critical Rendering Path (CRP), achieving perfect Core Web Vitals (INP, LCP, CLS), eliminating layout thrashing, and profiling client-side memory.

---

## 1. Core Web Vitals Thresholds & Diagnosing Bottlenecks

| Metric | Target | Focus Area | Primary Failure Causes | Principal Remediation |
|---|---|---|---|---|
| **INP** (Interaction to Next Paint) | **< 200ms** | Responsiveness | Main thread blocked by long tasks (>50ms); heavy synchronous React renders; excessive DOM mutations. | Break long tasks with `scheduler.yield()`; use React transitions (`useTransition`); push state down to leaf nodes. |
| **LCP** (Largest Contentful Paint) | **< 2.5s** | Loading Speed | Render-blocking CSS/JS; unoptimized hero image; slow server TTFB; client-side waterfalls. | Preload hero image (`priority`); inline critical CSS; eliminate client waterfalls via Server Components/streaming. |
| **CLS** (Cumulative Layout Shift) | **< 0.1** | Visual Stability | Unsized images and video elements; dynamically injected ads/banners; FOIT/FOUT from late-loading web fonts. | Set explicit `aspect-ratio` or `width`/`height`; use `next/font` zero-CLS variables; reserve layout space with skeletons. |

---

## 2. Interaction to Next Paint (INP) Deep Dive

INP measures the full latency of user interactions (clicks, taps, keypresses):

```
User Click ──► [ 1. Input Delay ] ──► [ 2. Processing Time ] ──► [ 3. Presentation Delay ] ──► Screen Update
               (Waiting for main      (Running event handler    (Rendering, layout,
                thread to be free)     callbacks in JS)          painting, compositing)
```

### Breaking Up Long Tasks (`scheduler.yield()`)
Never execute monolithic synchronous operations that take >50ms on the main thread. Yield control back to the browser between chunks:

```ts
export async function yieldToMain() {
  if ('scheduler' in window && 'yield' in (window as any).scheduler) {
    return await (window as any).scheduler.yield()
  }
  // Fallback for older browsers
  return new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

// Process 5,000 items without freezing UI frame rates
async function processLargeDataset(items: Item[]) {
  for (let i = 0; i < items.length; i++) {
    processSingleItem(items[i])
    // Yield every 100 items to allow pending user input and paints to execute
    if (i % 100 === 0) {
      await yieldToMain()
    }
  }
}
```

---

## 3. Layout Thrashing (Forced Synchronous Layout)

### The Anti-Pattern
Interleaving reads of geometric DOM properties (`offsetHeight`, `offsetWidth`, `scrollTop`, `getBoundingClientRect()`) with style writes forces the browser to recalculate layout repeatedly:

```js
// ❌ LAYOUT THRASHING: Reading immediately after writing in a loop
elements.forEach((el) => {
  el.style.width = '100px'       // Style write (invalidates layout)
  const height = el.offsetHeight // FORCED RE-LAYOUT! (Browser recalculates layout synchronously)
  el.style.height = `${height * 2}px` // Another write
})
```

### The Fix: Batch Reads Before Writes
```js
// ✅ BATCHED READS THEN WRITES: Single layout calculation
const heights = elements.map((el) => el.offsetHeight) // Batch read

elements.forEach((el, i) => {
  el.style.width = '100px'
  el.style.height = `${heights[i] * 2}px` // Batch write
})
```

---

## 4. DOM Virtualization for Massive Lists

Rendering more than 1,000 DOM nodes simultaneously degrades memory usage, scroll performance, and INP. Use virtualization (TanStack Virtual) to only render elements currently in the viewport:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

export function VirtualizedList({ items }: { items: string[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 5,
  })

  return (
    <div ref={parentRef} className="h-[500px] overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              transform: `translateY(${virtualItem.start}px)`,
              height: `${virtualItem.size}px`,
            }}
          >
            {items[virtualItem.index]}
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 5. Preventing Single Page Application Memory Leaks

1. **Observers Cleanup**: Always disconnect `IntersectionObserver`, `ResizeObserver`, and `MutationObserver` in component unmount:
   ```ts
   useEffect(() => {
     const observer = new ResizeObserver(handleResize)
     observer.observe(targetRef.current!)
     return () => observer.disconnect() // ✅ Critical cleanup
   }, [])
   ```
2. **Event Listeners on `window` / `document`**:
   ```ts
   useEffect(() => {
     window.addEventListener('keydown', handleKeyDown)
     return () => window.removeEventListener('keydown', handleKeyDown)
   }, [])
   ```
3. **Detached DOM References**: Avoid saving references to removed DOM elements in long-lived module-level variables.
