# Intense Manual & Exploratory Testing with Playwright MCP

> **Purpose**: A comprehensive runbook for conducting rigorous manual, visual, and exploratory testing sessions using Playwright MCP and browser automation tools.

---

## 1. The Exploratory QA Philosophy

Manual testing via Playwright MCP is **not casual clicking**. It is an adversarial, methodical investigation designed to uncover edge cases that automated tests miss.

### The 6 Investigative Vectors
1. **Requirements Conformance**: Does the feature strictly satisfy every stated requirement?
2. **Adversarial Input Fuzzing**: What happens when the system receives unexpected, malformed, or boundary data?
3. **Network & Timing Fragility**: How does the UI behave on 3G throttling, dropped connections, or API 500 responses?
4. **State Machine & Navigation Stress**: What happens on rapid double-clicking, browser Back/Forward, or refreshing mid-transaction?
5. **Console & Telemetry Audit**: Are there silent JavaScript exceptions, hydration warnings, or failed network assets?
6. **Accessibility & Usability**: Can the feature be navigated entirely by keyboard without visual or functional breaks?

---

## 2. Playwright MCP Manual Testing Execution Protocol

### Step 1: Initialize Session & Target Discovery
1. Open tab targeting the staging or local environment URL:
   - Tool: `browser.tabs.open({ url: "http://localhost:3000/feature" })`
2. Inspect page layout, headings, and initial DOM structure.
3. Capture clean baseline screenshot.

### Step 2: Requirement Baseline Verification (Happy Path)
1. Execute the primary user story step-by-step according to requirements.
2. Confirm expected success state, URL redirects, and database state.
3. Verify toast notifications, confirmation dialogs, and visual feedback.

### Step 3: Adversarial Input Fuzzing
Systematically assault all form fields and inputs with edge-case payloads:
- **Empty / Whitespace**: Submit pure whitespace (`"   "`), empty strings, and null inputs.
- **Extreme Lengths**: 1-character minimums and 10,000-character overflows (`"A".repeat(10000)`).
- **Boundary Numbers**: `-1`, `0`, `0.00001`, `9999999999999999`, `NaN`, `Infinity`.
- **Special Characters & Unicode**:
  - Null bytes: `%00`
  - Emojis & RTL text: `🚀🔥 אבג العربية`
  - Overlong UTF-8 & Zalgo text
  - HTML & Script payloads: `<script>alert(1)</script>`, `"><img src=x onerror=alert(1)>`
  - SQL meta-characters: `' OR '1'='1`, `"; DROP TABLE users; --`
- *Expectation*: The system must cleanly reject with friendly validation errors. It must **never** crash, display raw SQL/stack traces, or allow script execution.

### Step 4: Race Conditions & State Stress
- **Double Submit / Rapid Clicking**: Rapidly click submit buttons multiple times before the server responds to test for duplicate transactions or race conditions.
- **Back/Forward Navigation**: Fill out a multi-step wizard, click the browser Back button, modify a field, and click Forward. Verify form state integrity.
- **Mid-Flight Refresh**: Refresh the page (`F5`) while an asynchronous transaction or upload is in progress. Verify that the UI recovers gracefully without corrupting state.

### Step 5: Network Throttling & Chaos Injection
Using browser network controls:
- **Simulate Slow 3G**: Verify that loading skeletons appear, buttons show disabled/loading spinners, and the user cannot submit duplicate actions while waiting.
- **Simulate Offline / Network Drop**: Disconnect network mid-action. Verify the application shows a clean offline banner or retry button rather than a blank white screen.
- **Mock API 500 / 403 Responses**: Simulate backend server failure. Verify the user receives an informative, recoverable error state with a "Try Again" option.

### Step 6: Console & Network Telemetry Inspection
Always inspect the browser developer tools during every manual test session:
- Check for red **Uncaught TypeError** or React hydration mismatch warnings in the console.
- Check network tab for failed `404` image/font assets or unexpected duplicate API requests.

### Step 7: Accessibility (A11y) Keyboard Audit
- Disconnect mouse interaction.
- Navigate the entire feature using only `Tab`, `Shift+Tab`, `Space`, `Enter`, and Arrow keys.
- **Verify**:
  - Focus indicator is visibly distinct on every active interactive element.
  - Modals trap focus (pressing `Tab` cannot escape to hidden background elements).
  - Pressing `Escape` closes dropdowns and dialogs.
