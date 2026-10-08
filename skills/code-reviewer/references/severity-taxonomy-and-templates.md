# Severity Taxonomy & Humanized Review Templates

> **Purpose**: Standardized, non-robotic review output formats for pull request summaries and inline code review comments.

---

## 1. Severity Taxonomy

- **P0 — Blocker**: Security vulnerability, data loss, race condition, crash bug, or broken build. Must fix immediately before merge.
- **P1 — High**: Significant defect, broken access control, missing error handling, or performance regression. Must fix before release.
- **P2 — Medium**: Code smell, unnecessary complexity, suboptimal caching, or clean code violation. Address in current PR or planned follow-up.
- **P3 — Low / Nit**: Minor stylistic preference, naming suggestion, or non-blocking cleanup. Author's discretion.

---

## 2. Pull Request Review Summary Template (Humanized)

```markdown
### Summary
[1-2 sentences summarizing the change, its strengths, and the verdict.]

---

### Key Findings

#### Blocker (P0 / P1)
- **`path/to/file.ts:42`**: [Concrete technical issue, failure mode, and suggested fix.]

#### Suggestions (P2 / P3)
- **`path/to/file.ts:88`**: [Clean code refactoring, naming simplification, or minor optimization.]

---

### Verdict
[Ready to merge | Needs changes on P0/P1 items before merge]
```

---

## 3. Inline Comment Template (Humanized)

### For a Blocker Bug / Security Issue:
```markdown
**[Blocker]** This endpoint accepts an `orderId` without verifying that the authenticated user owns the order. An attacker can access other tenants' orders (IDOR).

Filter by `session.organizationId` as well:

```suggestion
const order = await db.orders.findFirst({
  where: { id: orderId, organizationId: session.orgId },
});
```
```

### For a Clean Code / Simplification Suggestion:
```markdown
**[Suggestion]** We can simplify this 30-line function into a readable pipe using `Object.groupBy`:

```suggestion
const groupedUsers = Object.groupBy(users, (u) => u.role);
```
```

### For a Question:
```markdown
**[Question]** Does this external webhook retry automatically on a 500 status? If so, we need an idempotency check here before writing to the database.
```
