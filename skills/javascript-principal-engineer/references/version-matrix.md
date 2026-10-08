# ECMAScript Version Matrix & Documentation Protocol

> **Rule for Agents**: Always identify the runtime execution environment (Browser, Node.js, V8 version) and target ECMAScript standard. If working with cutting-edge TC39 features or uncertain of language syntax, query official MDN and TC39 specifications live.

---

## 1. Modern ECMAScript Standard Milestones

| Feature | Specification | Description / Primary Utility |
|---|---|---|
| **Array & Object Grouping** | ES2024 | `Object.groupBy()` and `Map.groupBy()` natively replace utility grouping libraries. |
| **`Promise.withResolvers()`** | ES2024 | Extracts promise resolution hooks without wrapper callback nesting. |
| **Non-Mutating Array Methods** | ES2023 | `toSorted()`, `toReversed()`, `toSpliced()`, and `with()` return fresh copies. |
| **Native Set Operations** | ES2025 | `union()`, `intersection()`, `difference()`, `isSubsetOf()` built into `Set`. |
| **Explicit Resource Management** | ES2025 / Stage 3 | `using` and `await using` keywords with `Symbol.dispose` / `Symbol.asyncDispose`. |
| **RegExp `v` Flag** | ES2024 | Set notation and string properties inside regular expressions. |
| **Import Attributes** | ES2025 | Standardized `import x from './data.json' with { type: 'json' }`. |
| **Temporal API** | Stage 3 / 4 | Modern date/time engine replacing the legacy, mutable `Date` object. |

---

## 2. Live Documentation Query Protocol (Never Get Outdated)

When an agent needs authoritative reference on JavaScript language mechanics:

1. **MDN Web Docs (Canonical Reference)**:
   - JavaScript Index: `https://developer.mozilla.org/en-US/docs/Web/JavaScript`
   - Specific API: `https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/<Object>/<method>`
   - *Example*: `https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/groupBy`
   - *Example*: `https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers`
2. **TC39 Finished Proposals**:
   - `https://github.com/tc39/proposals/blob/main/finished-proposals.md`
3. **V8 Engine Technical Deep Dives**:
   - `https://v8.dev/blog`
