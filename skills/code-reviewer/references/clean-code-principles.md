# Clean Code Principles & Software Craftsmanship

> **Primary Sources**: Robert C. Martin (Uncle Bob), *Clean Code: A Handbook of Agile Software Craftsmanship*; Joost Visser, *Building Maintainable Software*; and `gpcoder.gitbook.io/clean-code`.

---

## 1. What Is Clean Code?

> "Clean code is simple and direct. Clean code reads like well-written prose. Clean code never obscures the designer's intent but rather is full of crisp abstractions and straightforward lines of control." — Grady Booch

Clean code can be read, understood, and enhanced by any developer on the team without friction. It directly reduces technical debt and maintenance costs.

---

## 2. Meaningful Names

- **Use Intention-Revealing Names**: A variable, function, or class name should answer why it exists, what it does, and how it is used without requiring comments:
  ```ts
  // ❌ BAD: Vague, non-descriptive
  const d = 86400
  const list1 = getItems()

  // ✅ CLEAN: Intention-revealing
  const SECONDS_PER_DAY = 86400
  const activeUnpaidInvoices = getActiveUnpaidInvoices()
  ```
- **Make Meaningful Distinctions**: Avoid noise words (`ProductInfo` vs `ProductData` vs `Product`). If two things are distinct, name their distinction explicitly.
- **Pronounceable & Searchable Names**: Single-letter variables (`e`, `i`, `x`) are only acceptable as local loop counters in very short scopes. Avoid mental mapping.
- **Classes vs Functions**:
  - Classes and objects should have **noun** or noun-phrase names (`Customer`, `Account`, `AddressParser`). Avoid manager/helper/data suffixes where possible.
  - Methods and functions should have **verb** or verb-phrase names (`postPayment`, `deletePage`, `saveOrder`).

---

## 3. Functions & Units of Code

- **Small**: Limit function length to 15–20 lines of code.
- **Do One Thing**: A function should do one thing, do it well, and do it only. If a function contains sections that can be extracted into separate functions with meaningful names, it is doing more than one thing.
- **Single Level of Abstraction (SLAP)**: Statements within a function should all reside at the same level of abstraction. High-level policy functions should not mix with low-level string manipulation or raw SQL.
- **Small Interfaces (Function Arguments)**:
  - Ideal: 0 arguments (niladic).
  - Good: 1 argument (monadic) or 2 arguments (dyadic).
  - Maximum: 3 arguments (triadic).
  - More than 3 arguments: Wrap them into a dedicated options object.
- **Command Query Separation (CQS)**: A function should either do something (command / mutate state) or answer something (query / return data), but **never both**.
- **No Side Effects**: A function must not make hidden alterations to passed arguments, global variables, or unexpected system state.

---

## 4. Comments & Self-Documenting Code

- **Explain Yourself in Code, Not Comments**: Comments do not make up for bad code. If code is unclear, refactor the code rather than writing an explanatory comment.
- **The Boy Scout Rule**: Always leave the code cleaner than you found it.
- **Good Comments**:
  - Legal and copyright notices.
  - Explaining complex, non-obvious regular expressions or mathematical algorithms.
  - Clarification of external API quirks or unavoidable third-party workarounds.
  - Warning of consequences (e.g. `// Warning: running this resets the local cache`).
- **Bad Comments (Delete Immediately)**:
  - Mumbling or redundant comments that restate the code (`i++; // increment i`).
  - Misleading or stale comments that fell out of sync with code changes.
  - **Commented-Out Code**: Delete immediately; git history preserves deleted lines.

---

## 5. Objects, Data Structures & The Law of Demeter

### Objects vs Data Structures (Anti-Symmetry)
- **Objects** hide their data behind abstractions and expose behavior (methods that operate on that data).
- **Data Structures** expose their data (properties) and have no significant behavior (DTOs, plain JSON objects).
- Do not create hybrid structures (half object, half data structure).

### The Law of Demeter (Principle of Least Knowledge)
A module should not know about the innards of the objects it manipulates. **Tell, Don't Ask**.
- An object method `M` of class `C` should only invoke methods of:
  1. `C` itself.
  2. An object created by `M`.
  3. An object passed as an argument to `M`.
  4. An object held in an instance variable of `C`.
- **Train Wrecks**: Avoid chains of calls:
  ```ts
  // ❌ TRAIN WRECK: Violates Demeter
  const outputDir = ctxt.getOptions().getScratchDir().getAbsolutePath()

  // ✅ CLEAN: Tell, Don't Ask
  const outputDir = ctxt.createScratchFileStream()
  ```

---

## 6. Error Handling

- **Prefer Typed Errors / Exceptions over Return Error Codes**: Avoid cluttering business logic with nested `if (status === ERROR_CODE)` branches.
- **Never Return Null**: Returning `null` forces every caller to write defensive null checks. If a caller forgets, a runtime crash occurs. Return empty collections (`[]`), null-object representations, or Option/Result types.
- **Never Pass Null**: Passing `null` as an argument forces defensive checks inside the function body.

---

## 7. Kent Beck's 4 Rules of Simple Design

In order of priority:
1. **Runs all tests**: A system that cannot be verified is not clean.
2. **Contains no duplication**: DRY (Don't Repeat Yourself). Duplication is the primary enemy of maintainability.
3. **Expresses intent of the programmer**: Clear naming, small functions, standard design patterns.
4. **Minimizes the number of classes and methods**: Prune unnecessary abstractions (YAGNI).

---

## 8. The SOLID Principles

- **S — Single Responsibility Principle (SRP)**: A class or module should have one, and only one, reason to change.
- **O — Open/Closed Principle (OCP)**: Software entities should be open for extension, but closed for modification.
- **L — Liskov Substitution Principle (LSP)**: Subtypes must be substitutable for their base types without altering correctness.
- **I — Interface Segregation Principle (ISP)**: Many client-specific interfaces are better than one general-purpose interface.
- **D — Dependency Inversion Principle (DIP)**: High-level modules should depend on abstractions, not on concrete low-level details.
