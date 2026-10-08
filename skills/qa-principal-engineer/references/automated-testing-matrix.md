# Automated Testing Matrix & Framework Mastery

> **Purpose**: Technical playbook for authoring production-grade automated tests across the test pyramid: Vitest/Jest (Unit/Integration), Playwright & Cypress (E2E), Storybook (Component & Visual Regression), and Pytest (Backend).

---

## 1. Test Pyramid & Tooling Allocation

```
             ╱╲
            ╱E2E╲          Playwright / Cypress (10-20% of tests)
           ╱─────╲
          ╱ Visual╲        Storybook Interaction / Visual Regression (20-30%)
         ╱─────────╲
        ╱Integration╲      Vitest / Jest / Supertest / Pytest (30-40%)
       ╱─────────────╲
      ╱  Unit Tests   ╲    Vitest / Jest / Pytest (40-50% of tests)
     ╱─────────────────╲
```

---

## 2. Playwright E2E Architecture

Playwright is the modern industry standard for resilient, cross-browser, multi-tab end-to-end testing:

### Best Practices
- **User-Facing Locators**: Always prefer `page.getByRole()`, `page.getByLabel()`, and `page.getByText()` over brittle CSS selectors (`.btn-primary > div`).
- **Web-First Assertions**: Use `expect(locator).toBeVisible()` which automatically retries until timeout, eliminating flaky `sleep()` calls.
- **Trace Viewer & Network Mocking**: Record traces on test retry/failure; mock third-party external APIs using `page.route()`.

```ts
// tests/e2e/checkout.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Checkout Flow', () => {
  test('completes purchase with valid credit card', async ({ page }) => {
    // 1. Mock external stripe webhook/API
    await page.route('**/api/stripe/charge', async (route) => {
      await route.fulfill({ status: 200, json: { success: true } })
    })

    // 2. Perform actions using user-facing roles
    await page.goto('/shop/cart')
    await page.getByRole('button', { name: 'Proceed to Checkout' }).click()

    await page.getByLabel('Cardholder Name').fill('Jane Doe')
    await page.getByLabel('Card Number').fill('4242424242424242')
    await page.getByRole('button', { name: 'Pay $49.00' }).click()

    // 3. Assert resilient confirmation
    await expect(page.getByRole('heading', { name: 'Order Confirmed' })).toBeVisible()
    await expect(page.getByText('Thank you for your purchase')).toBeVisible()
  })
})
```

---

## 3. Cypress E2E Architecture

Cypress runs directly inside the browser run-loop, ideal for fast feedback and component isolation:

### Canonical Pattern with `cy.intercept`
```ts
// cypress/e2e/login.cy.ts
describe('Authentication', () => {
  it('displays error on invalid credentials', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 401,
      body: { error: 'Invalid credentials' },
    }).as('loginRequest')

    cy.visit('/login')
    cy.get('input[name="email"]').type('bad@example.com')
    cy.get('input[name="password"]').type('wrongpassword')
    cy.get('button[type="submit"]').click()

    cy.wait('@loginRequest')
    cy.get('[aria-live="polite"]').should('contain.text', 'Invalid credentials')
  })
})
```

---

## 4. Storybook: Component & Interaction Testing

Storybook isolates UI components from complex backend dependencies and verifies interactions directly within CSF 3.0:

### Interaction Testing with the `play` Function
```tsx
// src/components/LoginForm.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { within, userEvent, expect } from '@storybook/test'
import { LoginForm } from './LoginForm'

const meta: Meta<typeof LoginForm> = {
  component: LoginForm,
  title: 'Forms/LoginForm',
}
export default meta

type Story = StoryObj<typeof LoginForm>

export const InvalidEmailSubmission: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Simulate real user interaction
    await userEvent.type(canvas.getByLabelText(/email/i), 'invalid-email')
    await userEvent.click(canvas.getByRole('button', { name: /log in/i }))

    // Assert accessibility and error feedback
    await expect(canvas.getByText(/please enter a valid email/i)).toBeInTheDocument()
  },
}
```

---

## 5. Vitest & Jest (Unit & Integration)

High-speed unit and integration tests with deterministic mocks and snapshot testing:

```ts
// src/services/pricing.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateDiscount } from './pricing'
import { fetchUserTier } from './user-tier'

vi.mock('./user-tier', () => ({
  fetchUserTier: vi.fn(),
}))

describe('calculateDiscount()', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('applies 20% discount for VIP users on carts over $100', async () => {
    vi.mocked(fetchUserTier).mockResolvedValue('VIP')

    const result = await calculateDiscount({ userId: 'usr_1', cartTotal: 150 })
    expect(result).toEqual({ discount: 30, finalTotal: 120 })
  })

  it('throws error when cart total is negative', async () => {
    await expect(calculateDiscount({ userId: 'usr_1', cartTotal: -10 }))
      .rejects.toThrow('Cart total cannot be negative')
  })
})
```

---

## 6. Pytest (Backend Python Testing)

For backend Python services, Pytest provides elegant fixtures and parametrized test matrices:

```python
# tests/test_orders.py
import pytest
from app.services import calculate_tax

@pytest.fixture
def base_order():
    return {"items": [{"name": "Book", "price": 20.0}], "state": "CA"}

@pytest.mark.parametrize("state,expected_tax_rate", [
    ("CA", 0.0725),
    ("NY", 0.04),
    ("TX", 0.0625),
    ("OR", 0.0), # No sales tax
])
def test_tax_calculation_by_state(base_order, state, expected_tax_rate):
    base_order["state"] = state
    tax = calculate_tax(base_order)
    assert tax == round(20.0 * expected_tax_rate, 2)

def test_invalid_order_raises_exception():
    with pytest.raises(ValueError, match="Order must have at least one item"):
        calculate_tax({"items": [], "state": "CA"})
```
