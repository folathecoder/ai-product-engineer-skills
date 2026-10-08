# V8 Engine Internals & Memory Architecture

> **Purpose**: Authoritative engineering reference for writing JavaScript with mechanical sympathy for the V8 engine, optimizing inline caching, and profiling memory lifecycles.

---

## 1. Hidden Classes (Shapes / Maps)

JavaScript objects do not have fixed compile-time layouts. V8 creates internal **Shapes** (hidden classes) to optimize property lookups:

```js
// ❌ ANTI-PATTERN: Dynamic shape divergence
const p1 = {}
p1.x = 10
p1.y = 20 // Shape: Base -> (x) -> (x, y)

const p2 = {}
p2.y = 20
p2.x = 10 // Shape: Base -> (y) -> (y, x) -> DIVERGED!
```

### The Monomorphic Golden Rule
Initialize all properties in the same order, preferably inside class constructors or object factory literals:

```js
// ✅ IDIOMATIC: Shared shape across all instances
class Point {
  constructor(x, y) {
    this.x = x
    this.y = y
  }
}
```

---

## 2. Inline Caching (IC) Tiers

Inline Caches record the shapes of objects passed to property lookups and method invocations:

1. **Monomorphic**: The call site always observes a single Shape. Property lookup is replaced by an instant direct memory offset access (fastest).
2. **Polymorphic**: The call site sees 2 to 4 different Shapes. Handled with a short unrolled conditional jump table.
3. **Megamorphic**: The call site sees 5+ different Shapes. V8 bails out of inline caching and falls back to a slow global hash-table lookup.
   - *Principal rule*: Hot functions (executed thousands of times in inner loops) must remain strictly **monomorphic**.

---

## 3. V8 Garbage Collection Architecture

The V8 heap is segregated into generational spaces:

### New Space (Young Generation)
- Sized between 1MB and 64MB.
- Managed by the **Scavenger** using Cheney's copying algorithm (divided into `From` and `To` semi-spaces).
- Ultra-fast pointer-bump allocation. Objects that survive two Minor GC cycles are promoted to Old Space.

### Old Space (Tenured Generation)
- Contains objects that survived the young generation.
- Managed by **Major GC** using a three-phase algorithm:
  1. **Marking**: Identifies live objects reachable from roots (concurrent).
  2. **Sweeping**: Reclaims memory of dead objects (concurrent).
  3. **Compacting**: Defragments fragmented memory blocks (parallel).

---

## 4. Diagnosing Memory Leaks

Common V8 memory leak culprits:
1. **Accidental Global Variables**: Values attached to `globalThis` or `window`.
2. **Leaky Closures**: Long-lived functions retaining references to outer lexical scopes.
3. **Uncleared Event Listeners**: Listeners on singletons retaining bound contexts.
4. **Cache Maps without TTL**: Unbounded `Map` instances growing until process crash.
