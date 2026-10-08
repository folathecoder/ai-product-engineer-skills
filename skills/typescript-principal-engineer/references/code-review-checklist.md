# Principal TypeScript Code Review Checklist

> **Purpose**: A severity-ranked checklist used by principal engineers to review TypeScript pull requests, eradicate type holes, enforce strict soundness, and prevent runtime exceptions.

---

## Severity Classification

| Level | Definition | Action |
|---|---|---|
| **P0 — Critical** | Blatant type hole (`any`), double-assertion bypass (`as unknown as`), or runtime crash vector. | **BLOCKER**. Must resolve immediately. |
| **P1 — High** | Missing exhaustiveness check, unhandled `undefined` access, or leaky generic abstraction. | **BLOCKER**. Must fix before merging. |
| **P2 — Medium** | Unnecessary type widening, method bivariance risk, or sub-optimal compiler configuration. | **ACTIONABLE**. Address in current PR. |
| **P3 — Low / Nit** | Redundant explicit annotations, stylistic naming, or minor type simplification. | **SUGGESTION**. Non-blocking. |

---

## 1. P0 — Critical (Type Holes & Runtime Failure Vectors)

### 🚨 Eradicate `any`
- [ ] **Zero `any` Allowed**: Verify neither explicit `any` nor implicit `any` exists.
  - *Fix*: Replace with `unknown` and narrow with type guards or schemas (Zod).
- [ ] **No Double Type Assertions (`as unknown as T`)**: Forcing incompatible types bypasses the compiler's safety guarantees entirely and usually masks a fundamental design flaw.
  - *Fix*: Refactor the underlying types to form a valid union, intersection, or generic transformation.
- [ ] **No Unsafe Non-Null Assertions (`!`)**: Using `value!` asserts away `null` and `undefined` without runtime verification.
  - *Fix*: Replace with explicit runtime guards, optional chaining `?.`, or default fallbacks `??`.

---

## 2. P1 — High (Exhaustiveness, Boundary Leaks & Soundness)

### 🛡️ Discriminated Unions & Exhaustiveness
- [ ] **Exhaustive Pattern Matching**: In `switch` or `if/else` ladders over discriminated unions, verify the default branch enforces exhaustiveness using the `never` idiom:
  ```ts
  function assertNever(x: never): never {
    throw new Error(`Unhandled union variant: ${JSON.stringify(x)}`)
  }
  ```
- [ ] **Array / Record Index Checks**: Under `noUncheckedIndexedAccess: true`, ensure accesses to `record[key]` or `array[i]` account for `undefined` before calling methods.

### 🛡️ Generic Safety & Boundary Integrity
- [ ] **Constrain All Generics**: Never use unbounded `<T>` when constraints apply (`<T extends Record<string, unknown>>`).
- [ ] **Defensive Immutability**: Function parameters accepting collections should use `readonly T[]` or `Readonly<T>` to prevent unintended mutations of caller state.

---

## 3. P2 — Medium (Variance, Widening & Compiler Alignment)

### ⚡ Precise Inference & Variance
- [ ] **Prefer `satisfies` over `as Type`**: When creating configuration objects, use `satisfies` to guarantee type conformance without widening literal types.
- [ ] **Method Signatures vs Property Signatures**: Declare object methods as property signatures (`fn: (arg: T) => void`) rather than method signatures (`fn(arg: T): void`) to ensure strict contravariance under `strictFunctionTypes`.
- [ ] **Const Parameters**: Use `<const T>` on generic utility functions that consume literals to eliminate manual `as const` call-site boilerplate.

---

## 4. P3 — Low / Polish (Ergonomics & Cleanliness)

### 🧹 Clean Type Aesthetics
- [ ] **Omit Redundant Annotations**: If TypeScript can infer the type cleanly (`const count = 5`), do not clutter the code with explicit `: number`.
- [ ] **Consistent Interface vs. Type Usage**: Standardize on `interface` for extensible public APIs and OOP shapes; use `type` for unions, primitives, tuples, and mapped types.
- [ ] **Meaningful Generic Parameter Names**: Avoid single-letter soups (`T, U, V, W, X`). Prefer descriptive names (`TData`, `TError`, `TContext`).
