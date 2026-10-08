# Code Smells & Refactoring Playbook

> **Primary Sources**: Martin Fowler, *Refactoring: Improving the Design of Existing Code*; Robert C. Martin, *Clean Code*; and `gpcoder.gitbook.io/clean-code`.

---

## 1. Bloaters: Code That Grew Too Large

### Long Method / Function (>20 Lines)
- **Smell**: A single function contains multiple levels of abstraction, handles database access, formatting, and validation.
- **Refactoring**: **Extract Function**. Break the function into small, intention-revealing functions where each does one thing.

### Primitive Obsession
- **Smell**: Using raw primitives (`string`, `number`) for domain concepts with validation rules (e.g. `zipCode: string`, `currency: string`, `userId: string`).
- **Refactoring**: Replace Data Value with Object or Branded Type (`type ZipCode = Branded<string, 'ZipCode'>`).

### Data Clumps
- **Smell**: The same group of 3 or 4 parameters always appear together across multiple function signatures (e.g. `startDate`, `endDate`, `timeZone`).
- **Refactoring**: **Introduce Parameter Object** (e.g. `DateRange` interface).

---

## 2. Couplers: Excessive Dependencies Between Modules

### Feature Envy
- **Smell**: A method in Class A spends more time accessing data and methods in Class B than in its own class.
- **Refactoring**: **Move Method**. Move the logic to Class B where the data naturally lives.

### Message Chains (Law of Demeter Violations)
- **Smell**: `a.getB().getC().getD().doSomething()`. Code is tightly coupled to the internal structure of intermediate objects.
- **Refactoring**: **Hide Delegate**. Call `a.doSomething()` and let `a` coordinate its internal dependencies.

---

## 3. Change Preventers: Hard-to-Modify Code

### Divergent Change
- **Smell**: You find yourself having to change the same class or file for many different reasons (e.g. database schema changes, UI layout changes, and tax calculation changes all touch `Order.ts`).
- **Refactoring**: Apply the **Single Responsibility Principle (SRP)**. Extract separate classes (`OrderRepository`, `OrderTaxCalculator`, `OrderView`).

### Shotgun Surgery
- **Smell**: A single business change requires making dozens of small edits scattered across 15 different files.
- **Refactoring**: Move related functions into a single cohesive module.

---

## 4. Dispensables: Code That Should Not Exist

### Speculative Generality (YAGNI)
- **Smell**: Complex inheritance hierarchies, plugin hooks, and abstract factory interfaces built "just in case we need it in the future", but currently unused.
- **Refactoring**: **Collapse Hierarchy** and **Inline Class**. Build for current requirements; refactor when real needs emerge.

### Dead Code
- **Smell**: Unused functions, unreachable `switch` branches, or commented-out blocks of old code.
- **Refactoring**: Delete immediately. Git history preserves past versions.
