# Modern CSS Architecture & Design Systems

> **Purpose**: Authoritative reference for modern CSS standards, token-based design systems, container queries, headless component integration, and responsive layout architecture.

---

## 1. Modern CSS Standards (2024–2026)

### Container Queries (`@container`)
Responsive design based on the parent component's width, rather than the global viewport:

```css
.card-container {
  container-type: inline-size;
  container-name: card;
}

/* Card adapts based on its own allocated width, whether in sidebar or full page */
@container card (min-width: 450px) {
  .card-inner {
    display: flex;
    flex-direction: row;
    gap: 1.5rem;
  }
}
```

### The Relational Selector (`:has()`)
Parent styling based on child states without JavaScript event listeners:

```css
/* Style card container if it contains a checked checkbox */
.card:has(input[type="checkbox"]:checked) {
  border-color: var(--color-primary);
  background-color: var(--color-primary-subtle);
}

/* Style form if any field inside is invalid */
form:has(:user-invalid) button[type="submit"] {
  opacity: 0.6;
  pointer-events: none;
}
```

### CSS Cascade Layers (`@layer`)
Explicitly controls specificity precedence, preventing utility overrides from breaking:

```css
@layer reset, base, tokens, components, utilities;

@layer base {
  body { font-family: var(--font-sans); }
}

@layer utilities {
  .p-4 { padding: 1rem !important; }
}
```

---

## 2. Design System Tokens Architecture

Define semantic tokens using CSS Custom Properties to allow instant multi-theme (dark/light) switching:

```css
:root {
  /* Primitive Tokens */
  --slate-900: #0f172a;
  --slate-100: #f1f5f9;
  --blue-600: #2563eb;

  /* Semantic Tokens (Light Default) */
  --bg-canvas: #ffffff;
  --text-primary: var(--slate-900);
  --color-primary: var(--blue-600);
}

[data-theme="dark"] {
  /* Semantic Tokens (Dark Theme Override) */
  --bg-canvas: var(--slate-900);
  --text-primary: var(--slate-100);
  --color-primary: #3b82f6;
}
```

---

## 3. Headless UI Architecture (Radix UI / React Aria)

Never build complex accessible interactive widgets (select dropdowns, date pickers, accessible accordions) completely from scratch. Decouple **accessibility/state** from **visual presentation**:

```tsx
// Decoupled architecture:
// 1. Headless Engine handles keyboard, ARIA, focus trapping, and events (Radix)
// 2. Local styling applied via Tailwind CSS or CSS Modules
import * as Popover from '@radix-ui/react-popover'

export function UserProfilePopover({ user }: { user: User }) {
  return (
    <Popover.Root>
      <Popover.Trigger className="rounded-full ring-2 ring-primary">
        <img src={user.avatarUrl} alt={user.name} className="h-8 w-8 rounded-full" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="w-64 rounded-lg bg-canvas p-4 shadow-xl border border-muted">
          <p className="font-semibold text-primary">{user.name}</p>
          <p className="text-sm text-secondary">{user.email}</p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
```

---

## 4. Fluid Typography with `clamp()`

Eliminates abrupt media query breakpoint jumps for typography and spacing:

```css
/* Scales smoothly from 1rem (at 320px screen) to 2.5rem (at 1280px screen) */
h1 {
  font-size: clamp(1.75rem, 1rem + 2.5vw, 3rem);
  line-height: 1.15;
}
```
