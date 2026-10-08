# Top 25 Frontend Anti-Patterns & Canonical Fixes

> **Purpose**: A reference catalog of the 25 most frequent frontend anti-patterns, detail on their failure modes, and the idiomatic principal-level solution.

---

### 1. Mirroring Server State in `useEffect` + `useState`
- **Failure Mode**: Copying data from a query or fetch into local state creates out-of-sync race conditions and redundant re-render cascades.
- **Fix**: Consume server state directly from query hooks (TanStack Query / SWR / RSC) or derive state synchronously during render.

---

### 2. Using `<div>` for Buttons (`<div onClick={...}>`)
- **Failure Mode**: Divs are invisible to screen readers as actionable controls, cannot be focused with `Tab`, and cannot be activated with `Enter` or `Space`.
- **Fix**: Always use the native `<button>` element.

---

### 3. Array Index as React `key` (`key={index}`) on Dynamic Lists
- **Failure Mode**: Reordering, inserting, or filtering items causes React to reuse component state for the wrong items, creating severe visual state bugs.
- **Fix**: Use stable, unique entity IDs (`key={item.id}`).

---

### 4. Layout Thrashing in DOM Loops
- **Failure Mode**: Interleaving reading geometric properties (`offsetHeight`) with writing styles forces the browser into repeated synchronous reflows.
- **Fix**: Batch all layout reads first, then batch all style writes.

---

### 5. Unmemoized Context Values
- **Failure Mode**: Passing an object literal directly to `<Context.Provider value={{ user, theme }}>` creates a new object reference on every render, forcing every subscriber to re-render.
- **Fix**: Memoize the value with `useMemo` or use atomic state stores (Zustand).

---

### 6. Icon Buttons without Accessible Names
- **Failure Mode**: `<button onClick={del}><TrashIcon /></button>` announces as an unlabelled "button" to screen reader users.
- **Fix**: Add `aria-label="Delete item"` to the button and `aria-hidden="true"` to the SVG icon.

---

### 7. Eliminating Focus Rings (`outline: none`)
- **Failure Mode**: Stripping focus indicators prevents keyboard-only users from seeing which element is currently active.
- **Fix**: Provide visible, high-contrast focus rings using `:focus-visible` or Tailwind `focus-visible:ring-2`.

---

### 8. Out-of-Order Search Race Conditions
- **Failure Mode**: Rapid keystrokes trigger multiple in-flight fetch requests. An earlier request resolving late overwrites newer search results.
- **Fix**: Cancel previous in-flight requests using `AbortController` or use TanStack Query which handles cancellation automatically.

---

### 9. Rendering Massive Un-Virtualized Lists
- **Failure Mode**: Injecting 5,000 DOM nodes simultaneously exhausts browser memory and causes severe INP latency.
- **Fix**: Virtualize the list with TanStack Virtual.

---

### 10. Direct State Mutation in React
- **Failure Mode**: `state.items.push(newItem); setState(state)` fails to trigger re-renders because object references remain identical.
- **Fix**: Treat state as immutable: `setState([...state.items, newItem])`.

---

### 11. Leaking Observers and Event Listeners
- **Failure Mode**: Instantiating `ResizeObserver` or `window.addEventListener` in `useEffect` without returning a cleanup function leaks memory on every mount/unmount cycle.
- **Fix**: Always return `() => observer.disconnect()` or `() => window.removeEventListener(...)`.

---

### 12. Modals that Don't Trap Focus
- **Failure Mode**: Opening a modal overlay while pressing `Tab` continues cycling through hidden background page links.
- **Fix**: Use accessible dialog primitives (Radix UI / React Aria) that implement strict focus trapping and `Escape` key listeners.

---

### 13. Storing Shareable Filters in Ephemeral Memory
- **Failure Mode**: Search filters, active tab selection, and pagination offsets are stored in component state and lost upon browser refresh or sharing a link.
- **Fix**: Store bookmarkable state in URL query parameters (`nuqs` / React Router search params).

---

### 14. Positive `tabIndex > 0`
- **Failure Mode**: Explicit positive tab indices override natural DOM reading order, causing erratic jumps across the page.
- **Fix**: Rely on natural DOM source order or use `tabIndex={0}` / `-1`.

---

### 15. Form Errors Unlinked from Inputs
- **Failure Mode**: Error text is visually positioned beneath an input but not programmatically linked for screen readers.
- **Fix**: Add `aria-invalid="true"` and `aria-describedby="field-error-id"` to the input element.

---

### 16. Long Tasks Blocking the Main Thread
- **Failure Mode**: Running complex parsing or calculation loops (>50ms) locks up the browser UI, degrading INP.
- **Fix**: Yield to the main thread with `scheduler.yield()` or offload to a Web Worker.

---

### 17. Communicating State Solely with Color
- **Failure Mode**: Showing a red or green dot without text or icons excludes color-blind users from distinguishing status.
- **Fix**: Pair color cues with explicit text, shapes, or icons.

---

### 18. Barrel File Bundle Bloat
- **Failure Mode**: Importing a single icon from a massive barrel file (`import { Check } from 'lucide-react'`) imports thousands of modules into the client bundle.
- **Fix**: Use `optimizePackageImports` in bundler configuration or direct submodule imports.

---

### 19. Missing Loading Skeletons with Mismatched Dimensions
- **Failure Mode**: A loading skeleton is 50px tall, but the loaded content is 400px tall, causing a jarring Cumulative Layout Shift (CLS).
- **Fix**: Match skeleton dimensions exactly to target component layout.

---

### 20. Overusing Global State for Local Needs
- **Failure Mode**: Placing input text values or dropdown open booleans into a global Redux/Zustand store.
- **Fix**: Keep transient UI state colocated inside the component with `useState`.

---

### 21. Prop Drilling Across Many Component Layers
- **Failure Mode**: Passing callback handlers down 8 layers of components that do not use them.
- **Fix**: Use component composition (`children` / slots) or an atomic client store.

---

### 22. Unsanitized `dangerouslySetInnerHTML`
- **Failure Mode**: Rendering user-generated markdown or HTML strings directly into the DOM leads to stored XSS.
- **Fix**: Sanitize HTML using DOMPurify before injection.

---

### 23. Multiple Competing Sources of Truth
- **Failure Mode**: Both parent component and child component hold their own independent state for the same data, falling out of sync.
- **Fix**: Choose a single source of truth: fully controlled (props) or fully uncontrolled with default value.

---

### 24. Hardcoded Viewport Breakpoints
- **Failure Mode**: Relying on strict 768px media queries causes layout breakage when components are rendered inside narrow split-screens or sidebars.
- **Fix**: Use CSS Container Queries (`@container`) so components adapt to their immediate container's dimensions.

---

### 25. Flash of Incorrect Theme (FOUC)
- **Failure Mode**: Reading theme preference from `localStorage` inside a client `useEffect` renders light mode HTML on the server before snapping to dark mode in the browser.
- **Fix**: Inject a synchronous inline script in `<head>` to set the theme class on `<html>` before initial paint, or use cookie-based server theme rendering.
