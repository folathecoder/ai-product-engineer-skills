# Principal JavaScript Code Review Checklist

> **Purpose**: A severity-ranked checklist used by principal engineers to review JavaScript pull requests, prevent prototype pollution, eliminate closure memory leaks, optimize V8 execution, and guarantee runtime correctness.

---

## Severity Classification

| Level | Definition | Action |
|---|---|---|
| **P0 — Critical** | Prototype pollution, memory leak, unhandled promise crash, or dangerous `eval`. | **BLOCKER**. Must fix immediately. |
| **P1 — High** | Async in `forEach` bug, accidental argument mutation, or loose equality coercion. | **BLOCKER**. Must resolve before production. |
| **P2 — Medium** | V8 megamorphic deoptimization, unnecessary array allocations, or missing `WeakMap`. | **ACTIONABLE**. Address in current PR. |
| **P3 — Low / Nit** | `var` usage, redundant closures, or stylistic modernization. | **SUGGESTION**. Non-blocking. |

---

## 1. P0 — Critical (Security & Memory Blocker)

### 🚨 Prototype Pollution & Dynamic Execution
- [ ] **No Prototype Pollution**: Recursive object merge/clone functions must reject `__proto__`, `constructor`, and `prototype` keys from untrusted inputs.
- [ ] **Zero `eval()` or `new Function()`**: Dynamic code generation on arbitrary strings is strictly prohibited.

### 🚨 Closure Leaks & Floating Promises
- [ ] **Accidental Closure Memory Retention**: Verify inner functions do not close over large arrays, buffers, or DOM trees that outlive their necessity.
- [ ] **No Floating Promises**: All Promises must be `await`ed or explicitly handled via `.catch()`.

---

## 2. P1 — High (Asynchronous Correctness & State Mutation)

### ⚡ Async Execution Pitfalls
- [ ] **No `async` Callbacks in `Array.prototype.forEach`**: `forEach` does not await promises. Concurrent async operations inside `forEach` run un-awaited in the background:
  - *Fix*: Use `for...of` or `Promise.all(arr.map(...))`.
- [ ] **Strict Equality (`===`)**: Never use loose equality `==`. Always use strict equality `===` or `Object.is()`.

### 🛡️ Immutability & Side Effects
- [ ] **No Function Argument Mutation**: Functions should never mutate incoming parameter objects or arrays directly. Use ES2023 non-mutating copy methods (`toSorted`, `toReversed`, `with`) or shallow copies (`structuredClone`).

---

## 3. P2 — Medium (V8 Engine & Memory Optimization)

### 🚀 Mechanical Sympathy for V8
- [ ] **Monomorphic Object Shapes**: Instantiate object properties in the same order in constructors/classes to prevent Shape divergence and inline cache deoptimizations.
- [ ] **Weak References for Caches**: Use `WeakMap` or `WeakSet` when associating metadata with objects to allow automatic garbage collection.
- [ ] **Native ES2024+ Methods**: Replace custom utility algorithms with built-in primitives (`Object.groupBy`, `Promise.withResolvers`, `Set` methods).

---

## 4. P3 — Low / Polish (Modern Standards)

### 🧹 Modern Language Hygiene
- [ ] **Zero `var`**: Always use `const` by default; use `let` only when reassignment is mandatory.
- [ ] **Nullish Coalescing (`??`)**: Prefer `??` over logical OR `||` when zero `0` or empty string `""` are valid values.
