# Health Check & Verification Runbook

> **Purpose**: A rigorous verification sequence to establish a known-good baseline before writing any feature code or modifying an existing repository.

---

## The Pre-Modification Baseline Principle

**Rule**: Never write or modify application code in an unfamiliar repository until you have established the baseline health of the codebase. If tests or type-checking are already failing before you touch anything, you must know that upfront.

---

## 1. Static Type Checking

Runs the TypeScript compiler in dry-run mode without emitting files:

```bash
# Standard TypeScript
npx tsc --noEmit

# In monorepos (Turborepo)
pnpm turbo run typecheck # or pnpm turbo run type-check

# Vue / Nuxt
npx vue-tsc --noEmit
```

- **Target**: 0 errors. If type errors exist, capture them in your onboarding notes as pre-existing issues.

---

## 2. Code Quality & Lint Verification

```bash
# ESLint
npm run lint # or npx eslint .

# Biome (if used)
npx @biomejs/biome check .

# Prettier format check
npx prettier --check .
```

---

## 3. Automated Test Suite Execution

Run test suites in non-watch mode to evaluate regression safety:

```bash
# Vitest
npx vitest run

# Jest
npx jest --runInBand

# Node Native Test Runner
node --test

# In monorepos
pnpm turbo run test
```

- **Metrics to observe**:
  - Test pass/fail counts.
  - Test execution duration.
  - Flaky tests (tests that fail intermittently due to unseeded DB or clock dependencies).

---

## 4. Production Build Dry-Run

The ultimate test of dependency consistency and bundler integrity:

```bash
npm run build # or pnpm build, turbo run build
```

- **Verifies**:
  - All dynamic imports and asset pipelines resolve.
  - Next.js static generation (`getStaticProps` / static shells / metadata) completes.
  - Tree-shaking and bundler minification succeed without syntax errors.

---

## 5. Baseline Health Report Template

Document your findings in this structured format:

```markdown
### 📋 Codebase Baseline Health Report

- **Typecheck**: [PASS | FAIL (N errors)]
- **Linter**: [PASS | FAIL (N warnings, N errors)]
- **Unit Tests**: [PASS (N passed) | FAIL (N failed)]
- **Build**: [PASS | FAIL]
- **Pre-existing Defects**:
  - `path/to/test.ts`: [Description of pre-existing failure]
```
