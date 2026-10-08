# Accessibility (A11y) & WCAG 2.2 Mastery

> **Purpose**: Authoritative reference for building accessible web applications conforming to the W3C Web Content Accessibility Guidelines (WCAG 2.2 Level AA), WAI-ARIA authoring practices, and keyboard-first design.

---

## 1. The Core Rules of Accessible Web Architecture

### The First Rule of ARIA
> **If you can use a native HTML element or attribute with the semantics and behavior you require already built in, do so rather than re-purposing an element and adding an ARIA role, state, or property to make it accessible.**

- Use `<button>` instead of `<div role="button" tabIndex={0} onClick={...}>`.
- Use `<dialog>` or proper semantic modal primitives instead of generic overlays.
- Use `<a href="...">` for navigation, `<button>` for actions.

---

## 2. Keyboard Navigation & Focus Management

Every interactive feature must be 100% operable using only the keyboard (`Tab`, `Shift+Tab`, `Enter`, `Space`, and arrow keys).

### TabIndex Rules
- `tabIndex={0}`: Inserts an element into the natural keyboard tab order (use for custom widgets like tabs or cards).
- `tabIndex={-1}`: Makes an element programmatically focusable via `.focus()`, but skips it during keyboard tab navigation.
- **Never use `tabIndex > 0`**: Explicit positive tab indices break natural reading order and confuse screen reader users.

### Focus Trapping in Dialogs & Modals
When a modal opens:
1. Save the previously active element (`document.activeElement`).
2. Trap keyboard `Tab` cycles strictly inside the dialog.
3. Pressing `Escape` must close the dialog.
4. When closed, restore focus to the previously active element.

```tsx
// Using headless accessible primitives (Radix UI / React Aria)
import * as Dialog from '@radix-ui/react-dialog'

export function AccessibleModal({ isOpen, onClose, title, children }: Props) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className="modal-content" aria-describedby={undefined}>
          <Dialog.Title>{title}</Dialog.Title>
          {children}
          <Dialog.Close asChild>
            <button aria-label="Close modal">✕</button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

---

## 3. Accessible Name Computation & Labels

Every interactive control must have an accessible name calculated by the accessibility tree:

1. **Visible Label**: `<label htmlFor="email">Email Address</label><input id="email" />`
2. **`aria-labelledby`**: Points to another element's ID to provide the name.
3. **`aria-label`**: Provides an invisible label for icon-only buttons:
   ```tsx
   // ❌ INACCESSIBLE: Screen reader announces "button"
   <button onClick={deleteItem}><TrashIcon /></button>

   // ✅ ACCESSIBLE: Screen reader announces "Delete invoice button"
   <button onClick={deleteItem} aria-label="Delete invoice">
     <TrashIcon aria-hidden="true" />
   </button>
   ```

---

## 4. Accessible Form Inputs & Dynamic Errors

When form validation fails, screen readers must be informed immediately without visual scanning:

```tsx
export function AccessibleInputField({ label, id, error, value, onChange }: FieldProps) {
  const errorId = `${id}-error`

  return (
    <div className="field-group">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        value={value}
        onChange={onChange}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <span id={errorId} role="alert" className="error-text">
          {error}
        </span>
      )}
    </div>
  )
}
```

---

## 5. Live Regions (`aria-live`) for Dynamic UI Updates

When content updates dynamically without a page reload (e.g. notifications, search result count, shopping cart badge), inform assistive technology using live regions:

- **`aria-live="polite"`**: Screen reader waits until the user finishes their current task before announcing. (Use for search result counts, cart updates, status banners).
- **`aria-live="assertive"`**: Screen reader interrupts immediate speech. (Use only for critical emergency alerts and session expiration warnings).
