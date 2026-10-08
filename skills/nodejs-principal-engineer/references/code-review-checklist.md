# Principal Node.js Code Review Checklist

> **Purpose**: A severity-ranked checklist used by principal engineers to review Node.js pull requests, eliminate event loop blocking, prevent memory leaks, secure against injection attacks, and guarantee high-concurrency throughput.

---

## Severity Classification

| Level | Definition | Action |
|---|---|---|
| **P0 — Critical** | Event loop stall, memory leak, unhandled rejection crash, or command injection. | **BLOCKER**. Must fix immediately before merge. |
| **P1 — High** | Missing stream backpressure, unbounded timer/listener, or unhandled stream error. | **BLOCKER**. Must resolve before production. |
| **P2 — Medium** | Suboptimal I/O concurrency, missing request timeout signals, or inefficient Buffers. | **ACTIONABLE**. Address in current PR. |
| **P3 — Low / Nit** | Legacy module APIs (`url.parse`), missing file extensions, or minor style polish. | **SUGGESTION**. Non-blocking. |

---

## 1. P0 — Critical (Event Loop Stalls, Leaks & Security Blocker)

### 🚨 Event Loop Starvation
- [ ] **Zero Synchronous I/O in Request Paths**: Verify `fs.readFileSync`, `fs.writeFileSync`, or `child_process.execSync` are **never** called inside HTTP handlers or message listeners.
- [ ] **No CPU-Intensive JSON or Crypto on Main Thread**: Heavy cryptographic hashing or parsing massive JSON payloads (>10MB) must be offloaded to worker threads (`node:worker_threads`) or WebAssembly.
- [ ] **No ReDoS (Regular Expression Denial of Service)**: Ensure regex patterns evaluated on untrusted user input do not contain catastrophic backtracking.

### 🚨 Process Stability & Memory Leaks
- [ ] **No Unhandled Promise Rejections**: Verify every asynchronous operation has explicit error handling or is wrapped in standard error middleware. In Node.js, unhandled rejections terminate the process.
- [ ] **No Unbounded In-Memory Collections**: Verify cache objects or global `Map` instances have strict eviction policies (LRU) with hard size limits to prevent V8 heap OOM.
- [ ] **Command & Shell Injection Defense**: When using `child_process`, verify `exec` is never passed unescaped user input. Prefer `execFile` or `spawn` with an explicit argument array and `{ shell: false }`.

---

## 2. P1 — High (Streams, Context & Resource Management)

### 🌊 Stream Backpressure & Error Propagation
- [ ] **Pipelines Always Managed with `stream/promises`**:
  - Never use manual `.pipe()` without comprehensive error listeners on all stages.
  - Always use `await pipeline(source, transform, destination)` from `node:stream/promises` to ensure automatic stream cleanup on failure.
- [ ] **Backpressure Respected on Stream Writers**: Ensure manual `.write()` loops check the return boolean; if `false`, pause writing until the `'drain'` event fires.

### 🧵 Async Context & Explicit Cleanup
- [ ] **Context Loss Prevention in `AsyncLocalStorage`**: Verify event-driven callbacks (`socket.on`) and legacy callbacks wrapped in `AsyncResource.bind()` to prevent losing request tracking contexts.
- [ ] **Dangling Event Listeners**: Ensure listeners added to long-lived emitters (`process`, global singletons) are removed when the request or connection terminates.
- [ ] **Outgoing Network Timeouts**: Every outgoing network request (`fetch`, `http.request`) **must** include an `AbortSignal.timeout(ms)` to prevent socket hanging.

---

## 3. P2 — Medium (Performance, Buffering & Concurrency)

### ⚡ V8 & Native Optimization
- [ ] **Safe Buffer Allocations**: Use `Buffer.alloc()` (zero-filled) for untrusted data; avoid `Buffer.allocUnsafe()` unless immediately overwritten.
- [ ] **Connection Pooling**: Verify database and HTTP clients reuse connection pools rather than opening new TCP connections per request.
- [ ] **Node.js Native Modules**: Prefer native built-ins (`node:test`, `node:sqlite`, `node:crypto`) over external third-party dependencies where standard.

---

## 4. P3 — Low / Polish (Modern Node.js Conventions)

### 🧹 Modern Node.js Idioms
- [ ] **Explicit `node:` Namespace Imports**: All core module imports must use the `node:` prefix (e.g. `import fs from 'node:fs'`, not `import fs from 'fs'`).
- [ ] **Modern WHATWG URL API**: Never use deprecated legacy `url.parse()`; use `new URL()`.
- [ ] **Explicit ESM Extensions**: In ESM codebases (`"type": "module"`), verify relative imports include `.js` or `.ts` extensions.
