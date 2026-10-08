# Edge Cases & Adversarial Quality Engineering

> **Purpose**: A comprehensive catalog of edge cases, boundary hazards, and adversarial scenarios used to stress-test applications and expose fragile assumptions.

---

## 1. Boundary & Mathematical Edge Cases

- **Off-by-One Limits**:
  - Array bounds: Index `0`, Index `length - 1`, Index `length`.
  - Pagination: Page `0`, Page `1`, Page `999999`, Negative page `-1`.
  - Page size: `limit=0`, `limit=1`, `limit=100000`.
- **Numeric Overflow & Precision**:
  - Floating point inaccuracy: `0.1 + 0.2 = 0.30000000000000004` (especially dangerous in financial calculations).
  - Integer boundaries: `Number.MAX_SAFE_INTEGER` (`9007199254740991`), `Number.MIN_SAFE_INTEGER`, and values beyond `BigInt`.
  - Division by zero: `x / 0` yielding `Infinity` or crashing backend queries.

---

## 2. Temporal & Date Edge Cases

- **Timezone Mismatches**: User in UTC+14 (Line Islands) interacting with a user in UTC-11 (American Samoa).
- **Daylight Saving Time (DST)**: Transactions created during the 2:00 AM → 3:00 AM skip or the 2:00 AM → 1:00 AM fallback.
- **Leap Years & February 29th**: Recurring billing or annual calculations on leap years.
- **Clock Drift**: Client system clock set 24 hours into the past or future.

---

## 3. Concurrency & Asynchronous Race Conditions

- **Out-of-Order API Responses**:
  - User types "cat" in a search box: Request 1 ("c"), Request 2 ("ca"), Request 3 ("cat").
  - If Request 2 resolves *after* Request 3, does the UI show the results for "ca" or "cat"?
  - *Mitigation*: Ensure `AbortController` cancels previous in-flight requests or track request sequence IDs.
- **Optimistic UI Rollbacks**:
  - User likes an item optimistically.
  - Backend request fails (HTTP 500).
  - Verify UI reverts cleanly to unliked state and alerts user.
- **Double-Spend / Concurrent Mutation**:
  - Two parallel requests trying to claim the same discount voucher or seat reservation.

---

## 4. Internationalization & String Edge Cases

- **Right-to-Left (RTL) Scripts**: Arabic (`مرحبا`), Hebrew (`שלום`). Check for layout mirroring, broken punctuation, and misaligned buttons.
- **Case Mapping Traps**: The Turkish "I" problem (`"i".toUpperCase() !== "I"` in Turkish locale `tr-TR`).
- **Name Oddities**:
  - Single-name individuals ("Cher", "Plato").
  - Hyphenated names ("Smith-Jones").
  - Apostrophes ("O'Connor").
  - Extremely long names (150+ characters).

---

## 5. File Upload Adversarial Scenarios

- **Zero-Byte File**: Empty file (`0 bytes`).
- **Oversized File**: Uploading a 2GB file when limit is 10MB.
- **Extension / MIME Mismatch**: An executable binary renamed to `.jpg`.
- **Polyglot Files**: A valid GIF that also contains valid PHP/JavaScript code.
- **Zip Bombs**: A 42KB compressed zip file that expands into 4.5 petabytes.
