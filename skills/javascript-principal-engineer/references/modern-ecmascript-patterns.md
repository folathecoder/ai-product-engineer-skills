# Modern ECMAScript (ES2024–ES2026) Patterns

> **Purpose**: Idiomatic guide to adopting modern ECMAScript standards, eliminating external dependencies, and utilizing language primitives for state and collections.

---

## 1. Grouping Collections (`Object.groupBy` & `Map.groupBy`)

Replaces `lodash.groupBy` natively:

```js
const transactions = [
  { id: 1, category: 'food', amount: 20 },
  { id: 2, category: 'transport', amount: 15 },
  { id: 3, category: 'food', amount: 45 },
]

// Object.groupBy produces a null-prototype dictionary
const byCategory = Object.groupBy(transactions, (t) => t.category)
// Result: { food: [{...}, {...}], transport: [{...}] }

// Map.groupBy allows complex objects or primitives as keys
const byThreshold = Map.groupBy(transactions, (t) => t.amount > 30 ? 'high' : 'low')
```

---

## 2. Inverted Promise Orchestration with `Promise.withResolvers()`

Eliminates the callback-nesting boilerplate when converting event emitters or streams into promises:

```js
export function waitForEvent(emitter, eventName, timeoutMs = 5000) {
  const { promise, resolve, reject } = Promise.withResolvers()

  const timer = setTimeout(() => {
    reject(new Error(`Timeout waiting for event: ${eventName}`))
  }, timeoutMs)

  emitter.once(eventName, (data) => {
    clearTimeout(timer)
    resolve(data)
  })

  return promise
}
```

---

## 3. Immutable Array Manipulations (ES2023)

```js
const numbers = [10, 5, 40, 25]

// Sort without mutating original array
const sorted = numbers.toSorted((a, b) => a - b) // [5, 10, 25, 40]

// Reverse without mutating
const reversed = numbers.toReversed() // [25, 40, 5, 10]

// Replace element at index immutably
const updated = numbers.with(1, 999) // [10, 999, 40, 25]
```

---

## 4. Mathematical Set Operations (ES2025)

```js
const setA = new Set(['read', 'write'])
const setB = new Set(['write', 'execute'])

const allPermissions = setA.union(setB)            // Set(['read', 'write', 'execute'])
const shared = setA.intersection(setB)             // Set(['write'])
const onlyA = setA.difference(setB)                // Set(['read'])
const symmetricDiff = setA.symmetricDifference(setB) // Set(['read', 'execute'])
```

---

## 5. Explicit Resource Management (`using` & `Symbol.dispose`)

Ensures deterministic deterministic resource release when exiting lexical scope:

```js
class TemporaryLock {
  constructor(resourceName) {
    this.resource = resourceName
    console.log(`Acquired lock on ${this.resource}`)
  }

  [Symbol.dispose]() {
    console.log(`Released lock on ${this.resource}`)
  }
}

function processBatch() {
  using lock = new TemporaryLock('db-migration')
  // Work on migration...
  // Lock is released immediately upon return or thrown exception!
}
```
