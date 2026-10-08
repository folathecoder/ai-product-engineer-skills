# Requirements-Driven Test Planning & Test Case Engineering

> **Purpose**: Authoritative reference for authoring formal Test Plans, structured Test Matrices, and rigorous Test Cases using black-box and white-box test design techniques.

---

## 1. The Critical QA Mindset: Beyond the Happy Path

A principal QA engineer does not merely verify that code works under ideal conditions; they systematically attempt to break it. 
- **Requirements are contracts**: Every functional requirement, user story, and acceptance criterion must be mapped to positive, negative, and boundary tests.
- **Assumptions are risks**: Never assume an input is well-formed, a network request will succeed, or a user will click buttons in the intended sequence.
- **The 80/20 Rule of Defects**: 80% of software defects hide in edge cases, asynchronous race conditions, state transitions, and error-recovery paths.

---

## 2. Test Case Design Techniques

### I. Equivalence Partitioning (EP)
Divide the input domain into classes where the software treats all members identically. Test at least one valid and one invalid representative from each class.
- *Example*: Age input (18 to 65 allowed).
  - Invalid Partition: `< 18` (Test: 17)
  - Valid Partition: `18 - 65` (Test: 30)
  - Invalid Partition: `> 65` (Test: 66)

### II. Boundary Value Analysis (BVA)
Defects cluster at boundaries. Test precisely at the edge, just below, and just above:
- For range `18 to 65`:
  - Boundaries: `17` (off-by-one under), `18` (min valid), `19` (above min), `64` (below max), `65` (max valid), `66` (off-by-one over).

### III. State Transition Testing
Model the entity's lifecycle as a finite state machine (e.g. `Draft → Pending Review → Approved → Published → Archived`).
- Test all valid transitions.
- **Crucial**: Test illegal transitions (e.g. attempting to jump from `Draft` directly to `Published` or modifying an `Archived` record).

### IV. Decision Table Testing
For complex business logic with multiple Boolean conditions (e.g. discount rules based on loyalty tier, order total, and coupon validity):
- Construct a truth table covering all combinations of inputs and verify expected outcomes.

---

## 3. Standard Test Plan Template (IEEE 829 Aligned)

```markdown
# 📋 Master Test Plan: [Feature / Release Name]

### 1. Scope & Objectives
- **In Scope**: [List of features, user stories, APIs, and components under test]
- **Out of Scope**: [Explicit list of features deferred to future releases]

### 2. Requirements Traceability Matrix (RTM)
| Req ID | Requirement Description | Test Case IDs | Test Type | Status |
|---|---|---|---|---|
| REQ-01 | User must authenticate via MFA | TC-AUTH-01, TC-AUTH-02 | E2E / Security | Planned |
| REQ-02 | CSV export must complete < 2s | TC-PERF-01 | Performance | Planned |

### 3. Test Strategy & Levels
- **Unit / Component**: Vitest / Jest / Storybook
- **API / Integration**: Supertest / Playwright API
- **End-to-End (E2E)**: Playwright / Cypress
- **Manual & Exploratory**: Playwright MCP browser testing

### 4. Entry & Exit Criteria
- **Entry Criteria**: Feature deployed to staging; migration completed; smoke test passing.
- **Exit Criteria**: 100% of P0/P1 test cases passing; 0 open P0/P1 bugs; test coverage >= 85%.

### 5. Risk Assessment & Contingencies
- [List of third-party dependencies, rate limits, flaky test mitigation]
```

---

## 4. Standard Test Case Specification Template

```markdown
### Test Case: TC-[MODULE]-[ID]
- **Title**: [Concise summary of test action and expectation]
- **Requirement ID**: [Link to REQ-XX]
- **Type**: [Functional | Negative | Boundary | Security | Performance]
- **Priority**: [P0 Critical | P1 High | P2 Medium | P3 Low]
- **Preconditions**: [e.g. User logged in as 'Admin', database seeded with 5 items]

#### Test Steps
1. Navigate to `https://app.example.com/checkout`
2. Enter `"0.00"` into the custom donation field
3. Click "Complete Purchase"

#### Expected Result
- System displays an inline error message: `"Donation amount must be greater than $0.00"`
- Submit button is disabled
- No network request is dispatched to payment gateway
- No charge is registered in database

#### Actual Result (During Execution)
- [Pass / Fail notes]
```
