# Bug Reporting & Defect Lifecycle Standard

> **Purpose**: A rigorous template and protocol for authoring clear, actionable, and reproducible defect reports that eliminate communication friction between QA, engineering, and product.

---

## 1. Defect Severity & Priority Taxonomy

| Severity Level | Definition | Engineering SLA |
|---|---|---|
| **P0 — Blocker** | System crash, data loss/corruption, payment failure, security breach, zero workaround. | **Immediate hotfix**. Halts release. |
| **P1 — Critical** | Core business workflow broken, affects significant user cohort, no reasonable workaround. | Fix within 24 hours / current sprint. |
| **P2 — Major** | Non-critical feature broken or edge-case failure; functional workaround exists. | Prioritize in next sprint. |
| **P3 — Minor / Trivial** | Visual misalignment, typo, minor cosmetic glitch, negligible impact. | Backlog / polish sprint. |

---

## 2. Standard Bug Report Specification Template

```markdown
# 🐛 [BUG] [Component/Module]: [Short, Descriptive Summary]

### Metadata
- **Severity**: P0 Blocker | P1 Critical | P2 Major | P3 Minor
- **Environment**: Staging | Production | Local Dev
- **URL**: `https://staging.app.example.com/checkout`
- **Browser / Client**: Chrome 124.0.6367.60 / macOS 14.4 (Sonoma)
- **Viewport**: 1920x1080 (Desktop) | 375x812 (Mobile iPhone 14)
- **User Role**: Authenticated Buyer (`user_standard`)
- **Git Commit / Build ID**: `commit 8ca0815` / `build-v2.4.1`

---

### Description
[Concise narrative of what happened and why it violates the expected requirement.]

---

### Prerequisites / Setup
1. User account created with zero active payment methods.
2. Cart populated with at least 1 item ($25.00 value).

---

### Steps to Reproduce
1. Navigate to `/shop/cart` and click "Proceed to Checkout".
2. On the payment step, enter valid card number `4242...` but enter an expired expiration date (`01/22`).
3. Click "Submit Payment".
4. Immediately click "Submit Payment" a second time before error renders.

---

### Expected Behavior
- First request fails with inline validation error: `"Card expiration date is in the past"`.
- Button is disabled during submission to prevent duplicate requests.
- No charge is processed.

---

### Actual Behavior
- UI displays a blank white screen with an unhandled runtime error.
- Network tab shows two concurrent `POST /api/charge` requests; the second request succeeds unexpectedly using fallback cached tokens.

---

### Technical Evidence

#### Console Logs
\`\`\`
Uncaught TypeError: Cannot read properties of undefined (reading 'errorCode')
    at PaymentForm.tsx:142:18
    at onClick (PaymentButton.tsx:24:9)
\`\`\`

#### Network Telemetry
- Request: `POST /api/charge`
- Status: `500 Internal Server Error`
- Response Payload:
\`\`\`json
{
  "error": "UnhandledPaymentGatewayException",
  "message": "Double invocation detected on idempotency key"
}
\`\`\`

#### Visual Evidence
- Attached screenshot / recording: `[screenshot_payment_crash.png]`

---

### Root Cause Analysis (Hypothesis)
`PaymentForm.tsx` does not disable the submit button inside `useActionState` pending state, allowing duplicate dispatches that conflict with the backend idempotency key.
```

---

## 3. Bug Verification & Regression Closure Protocol

Before closing any defect reported by QA:
1. **Verify in Deployed Environment**: Never close a bug based on local code inspection alone; verify in staging or test builds.
2. **Execute Full Negative Path**: Confirm the original reproduction steps now produce the intended error handling.
3. **Run Regression Matrix**: Confirm that adjacent features (e.g. paying with an existing saved card) were not broken by the bug fix.
4. **Demand Automated Test Coverage**: A bug should be accompanied by a regression test (Vitest or Playwright) to guarantee it never recurs.
