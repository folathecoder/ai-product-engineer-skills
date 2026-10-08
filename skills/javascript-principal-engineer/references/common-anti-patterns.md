# Top JavaScript Anti-Patterns & Canonical Fixes

> **Purpose**: A reference catalog of the 20 most frequent JavaScript anti-patterns, detail on their failure modes, and the idiomatic principal-level solution.

---

### 1. `async` Callbacks inside `Array.prototype.forEach`
- **Failure Mode**: `forEach` ignores the returned Promise from the callback. Iterations run concurrently in un-awaited background microtasks, ignoring errors and completing outer execution prematurely.
- **Fix**: Use `for...of` for sequential execution or `Promise.all(arr.map(...))` for concurrent execution:
  ```js
  // ❌ FAILS
  items.forEach(async (item) => { await save(item) })

  // ✅ IDIOMATIC
  for (const item of items) {
    await save(item)
  }
  ```

---

### 2. Mutating Function Arguments Directly
- **Failure Mode**: Directly altering properties on passed objects or arrays causes subtle side effects across unrelated parts of the codebase.
- **Fix**: Return fresh copies using object spread `{ ...obj }`, array copy methods (`toSorted`, `toReversed`), or `structuredClone()`.

---

### 3. Loose Equality (`==`) Type Coercion Bugs
- **Failure Mode**: Implicit type coercion (`"" == 0` is `true`, `null == undefined` is `true`) leads to subtle logic vulnerabilities.
- **Fix**: Always use strict equality (`===`) or `Object.is()`.

---

### 4. Relying on Hoisting with `var`
- **Failure Mode**: `var` is function-scoped rather than block-scoped and hoised without temporal dead zones, leading to accidental variable leakage.
- **Fix**: Use `const` by default; use `let` when reassignment is strictly necessary.

---

### 5. Floating Promises (Uncaught Rejections)
- **Failure Mode**: Initiating an asynchronous operation without `await` or `.catch()` causes silent failures or process termination.
- **Fix**: Always `await` or explicitly handle errors: `doAsync().catch(logger.error)`.

---

### 6. Memory Retention via Strong `Map` / `Set`
- **Failure Mode**: Using objects as keys in a regular `Map` prevents V8 garbage collection even after the object is discarded elsewhere.
- **Fix**: Use `WeakMap` or `WeakSet` for object metadata associations.

---

### 7. Megamorphic Property Access in Hot Loops
- **Failure Mode**: Passing objects with divergent property shapes to performance-critical functions drops V8 into slow hash-table lookups.
- **Fix**: Use classes or consistent factory functions to guarantee monomorphic hidden classes.

---

### 8. Blocking Event Loop with Synchronous Loops on Huge Arrays
- **Failure Mode**: Iterating synchronously through millions of records freezes browser frame rates or Node server throughput.
- **Fix**: Chunk execution across macro-tasks with `setImmediate` / `requestAnimationFrame`, or use Web Workers.

---

### 9. Prototype Pollution via Object Merging
- **Failure Mode**: Blindly merging untrusted JSON properties (`__proto__`, `constructor`) modifies the global `Object.prototype`, creating privilege escalation bugs.
- **Fix**: Validate keys and reject `__proto__`, or use `Object.create(null)`.

---

### 10. Using `Date` for Modern Time Calculations
- **Failure Mode**: The legacy `Date` object mutates in place, has confusing 0-indexed months, and lacks robust timezone handling.
- **Fix**: Use the TC39 Temporal API (`Temporal.Now.instant()`).
