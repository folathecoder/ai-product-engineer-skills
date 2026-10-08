# Top TypeScript Anti-Patterns & Canonical Fixes

> **Purpose**: A reference catalog of the 20 most frequent TypeScript anti-patterns, detail on their failure modes, and the idiomatic principal-level solution.

---

### 1. Using `any` Instead of `unknown`
- **Failure Mode**: `any` disables all type-checking for that variable and spreads transitively throughout any code that touches it.
- **Fix**: Use `unknown` and narrow with type guards or validation schemas:
  ```ts
  // ❌ ANTI-PATTERN
  function parseData(input: any) {
    return input.user.name.toUpperCase() // Runtime crash if undefined
  }

  // ✅ IDIOMATIC
  function parseData(input: unknown) {
    if (typeof input === 'object' && input !== null && 'user' in input) {
      // Safely narrow or use Zod
    }
  }
  ```

---

### 2. Double Type Assertion (`as unknown as T`)
- **Failure Mode**: Bypasses the compiler's structural compatibility checks to force an incompatible type, creating a hidden runtime crash vector.
- **Fix**: Fix the underlying type signature, create an adapter function, or use discriminated unions.

---

### 3. Non-Null Assertion Operator (`!`) on Dynamic Data
- **Failure Mode**: Using `user!.profile!.email` silences the compiler when a value might actually be `null` or `undefined` at runtime.
- **Fix**: Use optional chaining `?.`, nullish coalescing `??`, or assertion functions:
  ```ts
  const email = user?.profile?.email ?? 'default@example.com'
  ```

---

### 4. Method Signatures Instead of Property Signatures on Interfaces
- **Failure Mode**: Method signatures (`foo(x: string): void`) are checked **bivariantly** under `strictFunctionTypes`. Property signatures (`foo: (x: string) => void`) are checked strictly **contravariantly**.
- **Fix**: Declare methods as property signatures:
  ```ts
  // ❌ Bivariant (Unsound)
  interface Consumer {
    process(data: string | number): void
  }

  // ✅ Contravariant (Sound)
  interface Consumer {
    process: (data: string | number) => void
  }
  ```

---

### 5. Using TypeScript Numeric Enums
- **Failure Mode**: Numeric enums generate IIFE runtime code, lack type safety (can assign arbitrary numbers in older TS), and don't preserve nominal keys cleanly.
- **Fix**: Use `as const` object literals or string union types:
  ```ts
  // ❌ AVOID
  enum Direction { Up, Down }

  // ✅ IDIOMATIC
  export const Direction = {
    Up: 'UP',
    Down: 'DOWN',
  } as const
  export type Direction = (typeof Direction)[keyof typeof Direction]
  ```

---

### 6. Overly Complex Type Gymnastics
- **Failure Mode**: Building 200-line recursive conditional mapped types to achieve micro-optimizations that slow down `tsc` compile times and confuse teammates.
- **Fix**: Keep types readable and pragmatic. Strive for simple Discriminated Unions and well-constrained generics.

---

### 7. Mutable Collections in Public Function Signatures
- **Failure Mode**: Passing `items: Item[]` allows the called function to mutate the caller's array (`items.push(...)`), leading to subtle state bugs.
- **Fix**: Use `readonly Item[]` or `ReadonlyArray<Item>`:
  ```ts
  function calculateTotal(items: readonly Item[]): number {
    // items.pop() // ❌ Compile error
    return items.reduce((acc, curr) => acc + curr.price, 0)
  }
  ```

---

### 8. Loose String Typing for Domain Identifiers
- **Failure Mode**: Using raw `string` for entity IDs allows passing an `OrganizationId` where a `UserId` was expected.
- **Fix**: Use Branded Types (`type UserId = string & { readonly __brand: 'UserId' }`).

---

### 9. Omitting `noUncheckedIndexedAccess`
- **Failure Mode**: Relying on `arr[0]` returning `T` without checking if the array has elements.
- **Fix**: Enable `"noUncheckedIndexedAccess": true` in `tsconfig.json`.

---

### 10. Type Widening on Configuration Objects
- **Failure Mode**: Defining a configuration object with an explicit type annotation widens exact literals into generic primitives (`string`).
- **Fix**: Use the `satisfies` operator to validate shape while preserving literal types.
