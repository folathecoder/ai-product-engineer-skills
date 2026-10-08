# TypeScript Version Matrix & Documentation Protocol

> **Rule for Agents**: Always inspect `package.json` to determine the installed TypeScript compiler version. If the project version is newer than this guide or if encountering an uncertain API or compiler option, query the official TypeScript documentation live.

---

## 1. Major TypeScript 5.x Feature Milestones

| Feature | Introduced | Primary Value / Constraint |
|---|---|---|
| **Decorators (Stage 3 standard)** | TS 5.0 | Replaces legacy experimental decorators with ECMAScript standardized decorators. |
| **`const` Type Parameters** | TS 5.0 | `<const T>` preserves literal types at call sites without requiring `as const`. |
| **`satisfies` Operator** | TS 4.9 / 5.0 | Validates a value matches a type without widening or erasing literal types. |
| **`verbatimModuleSyntax`** | TS 5.0 | Strict module emit; enforces `import type` for type-only imports across modern ESM runtimes. |
| **`using` Declarations** | TS 5.2 | Explicit Resource Management (`Symbol.dispose` / `Symbol.asyncDispose`). |
| **Type-Only Import in JSDoc** | TS 5.5 | Type-checking in pure JS without runtime imports. |
| **`isolatedDeclarations`** | TS 5.5 | Demands explicit return types on exports to enable blazing-fast parallel declaration emit. |
| **Checks for Never-Initialized Variables** | TS 5.7 | Detects variables accessed in closures that were never assigned a value. |
| **`rewriteRelativeImportExtensions`** | TS 5.7 | Rewrites `.ts` relative imports to `.js` upon compilation for in-place tools (Node type stripping). |
| **`--target ES2024` & `--lib ES2024`** | TS 5.7 | Native support for `Object.groupBy`, `Map.groupBy`, `Promise.withResolvers`, and generic `TypedArray`. |

---

## 2. Live Documentation Query Protocol (Never Get Outdated)

When an agent needs authoritative reference or encounters a newer TypeScript compiler release (TS 5.8, 5.9, 6.0+):

1. **Official Handbook & Guides**:
   - Basics & Everyday Types: `https://www.typescriptlang.org/docs/handbook/2/basic-types.html`
   - Narrowing & Control Flow: `https://www.typescriptlang.org/docs/handbook/2/narrowing.html`
   - Generics & Type Manipulation: `https://www.typescriptlang.org/docs/handbook/2/types-from-types.html`
   - Modules Reference: `https://www.typescriptlang.org/docs/handbook/modules/reference.html`
2. **Compiler Options Reference**:
   - `https://www.typescriptlang.org/tsconfig/` (e.g. `https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess`)
3. **Version Release Notes**:
   - `https://www.typescriptlang.org/docs/handbook/release-notes/typescript-<major>-<minor>.html`
   - *Example*: `https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-7.html`
4. **Performance & Diagnostics Wiki**:
   - `https://github.com/microsoft/TypeScript/wiki/Performance`
