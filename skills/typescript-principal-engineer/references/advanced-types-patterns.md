# Advanced TypeScript Engineering Patterns

> **Purpose**: Idiomatic, enterprise-grade TypeScript type-system patterns for domain modeling, compile-time safety, zero-runtime overhead abstractions, and exhaustiveness checking.

---

## 1. Branded (Nominal) Types for Domain Safety

TypeScript's structural type system allows any `string` to be passed where any other `string` is expected. Branded types inject unique compile-time brands into primitive types, preventing catastrophic accidental parameter swaps (e.g., passing a `PostId` where a `UserId` was expected):

```ts
// Declare a unique symbol to brand the type at compile-time with zero runtime footprint
declare const Brand: unique symbol

export type Branded<T, B extends string> = T & { readonly [Brand]: B }

export type UserId = Branded<string, 'UserId'>
export type PostId = Branded<string, 'PostId'>
export type Email = Branded<string, 'Email'>

// Validation constructor / type-guard
export function makeUserId(raw: string): UserId {
  if (!raw.startsWith('usr_')) {
    throw new Error('Invalid UserId format')
  }
  return raw as UserId
}

export function deleteUser(id: UserId) {
  // Safe from accidental post deletion
}

const userId = makeUserId('usr_123')
const postId = 'post_999' as PostId

// deleteUser(postId) // ❌ Compile-time error: Type 'PostId' is not assignable to type 'UserId'
deleteUser(userId)    // ✅ Valid
```

---

## 2. Discriminated Unions & Exhaustiveness Engine

Discriminated unions are the single most powerful modeling tool in TypeScript. Never represent complex state with loosely coupled optional booleans (`isLoading: boolean, isError: boolean, data?: T`).

### Canonical State Machine Union

```ts
export type AsyncState<TData, TError = Error> =
  | { readonly status: 'idle' }
  | { readonly status: 'pending' }
  | { readonly status: 'success'; readonly data: TData }
  | { readonly status: 'error'; readonly error: TError }

export function assertNever(x: never, message?: string): never {
  throw new Error(message ?? `Unexpected unhandled variant: ${JSON.stringify(x)}`)
}

export function renderUI<T>(state: AsyncState<T>) {
  switch (state.status) {
    case 'idle':
      return 'Ready'
    case 'pending':
      return 'Loading spinner...'
    case 'success':
      return `Loaded: ${state.data}`
    case 'error':
      return `Failed: ${state.error.message}`
    default:
      // If a new status is added (e.g. 'refreshing'), TypeScript halts compilation here!
      assertNever(state)
  }
}
```

---

## 3. Type Guards vs. Assertion Functions

### Type Predicates (`is`)
```ts
interface ApiSuccess<T> { success: true; data: T }
interface ApiFailure { success: false; error: string }
type ApiResponse<T> = ApiSuccess<T> | ApiFailure

export function isSuccess<T>(response: ApiResponse<T>): response is ApiSuccess<T> {
  return response.success === true
}
```

### Assertion Functions (`asserts`)
Throwing runtime errors while simultaneously narrowing the caller's scope:
```ts
export function assertNonNull<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message ?? 'Value was null or undefined')
  }
}

function process(input: string | null) {
  assertNonNull(input, 'Expected non-null string')
  // input is now narrowed to string on all subsequent lines
  input.toUpperCase()
}
```

---

## 4. Key Remapping & Template Literal Types

### Dynamic Event Map to Handler Interface
```ts
type SystemEvents = {
  userLogin: { userId: string; timestamp: number }
  orderPlaced: { orderId: string; amount: number }
  paymentFailed: { reason: string }
}

// Remap keys to create type-safe listener methods
export type EventHandlers<TEvents> = {
  [K in keyof TEvents as `on${Capitalize<string & K>}`]: (payload: TEvents[K]) => void | Promise<void>
}

// Resulting interface:
// {
//   onUserLogin: (payload: { userId: string; timestamp: number }) => void | Promise<void>
//   onOrderPlaced: (payload: { orderId: string; amount: number }) => void | Promise<void>
//   onPaymentFailed: (payload: { reason: string }) => void | Promise<void>
// }
```

---

## 5. The `satisfies` vs. `as` Rulebook

| Construct | Type Safety | Literal Preservation | Use Case |
|---|---|---|---|
| `const x: Type = ...` | High | **No** (Widens literals) | Variable declarations where widening is desired. |
| `const x = ... as Type` | **Unsafe** (Masks errors) | No | Legacy casts; avoid in principal codebases. |
| `const x = ... satisfies Type` | **Maximum** | **Yes** (Preserves exact literals) | Route definitions, configs, themes, and dictionary registries. |
