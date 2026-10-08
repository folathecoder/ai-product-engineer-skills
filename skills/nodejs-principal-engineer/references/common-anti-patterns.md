# Top Node.js Anti-Patterns & Canonical Fixes

> **Purpose**: A reference catalog of the 20 most frequent Node.js anti-patterns, detail on their failure modes, and the idiomatic principal-level solution.

---

### 1. Synchronous I/O in Request Handlers
- **Failure Mode**: Calling `fs.readFileSync` or `crypto.pbkdf2Sync` pauses the entire single-threaded event loop, stalling all concurrent HTTP requests.
- **Fix**: Use promise-based async APIs: `import fs from 'node:fs/promises'`.

---

### 2. Manual `.pipe()` without Error Listeners
- **Failure Mode**: Classic `.pipe()` does not forward errors between streams. If the source or transform fails, the destination stream hangs open, leaking memory and file descriptors.
- **Fix**: Always use `pipeline` from `node:stream/promises`.

---

### 3. Parsing Huge JSON Payloads on the Main Thread
- **Failure Mode**: `JSON.parse()` on a 50MB payload blocks the event loop for hundreds of milliseconds, spiking latency for all other requests.
- **Fix**: Offload parsing to a Worker Thread or use streaming JSON parsers (`stream-json`).

---

### 4. Unbounded Event Listener Accumulation
- **Failure Mode**: Registering `emitter.on(...)` inside a request handler without removing it emits `MaxListenersExceededWarning` and leaks memory across requests.
- **Fix**: Use `emitter.once(...)`, pass `{ once: true }`, or remove listeners in a `finally` block or `AbortSignal`.

---

### 5. Dangling Outgoing Requests without Timeouts
- **Failure Mode**: An outgoing `fetch()` or `http.request()` without a timeout hangs indefinitely if the remote server stalls, exhausting connection pools and sockets.
- **Fix**: Always attach `AbortSignal.timeout(ms)`:
  ```ts
  const res = await fetch('https://api.external.com', {
    signal: AbortSignal.timeout(5000)
  })
  ```

---

### 6. Command Injection via `child_process.exec`
- **Failure Mode**: Concatenating user strings into shell commands (`exec(\`convert \${input} out.png\`)`) allows shell injection attacks.
- **Fix**: Use `execFile` or `spawn` with an argument array and `{ shell: false }`.

---

### 7. Recursive `process.nextTick()` Starvation
- **Failure Mode**: Continually enqueueing callbacks via `process.nextTick` starves all I/O in the event loop, freezing timers and sockets.
- **Fix**: Use `setImmediate()` to defer execution to the next iteration of the event loop.

---

### 8. Leaking State in `AsyncLocalStorage`
- **Failure Mode**: Calling `asyncLocalStorage.enterWith(store)` persists the store across the entire synchronous execution, leaking across unrelated requests.
- **Fix**: Always prefer `asyncLocalStorage.run(store, callback)` or `using _ = asyncLocalStorage.withScope(store)`.

---

### 9. Using Deprecated Legacy APIs (`url.parse`, `crypto.createCipher`)
- **Failure Mode**: `url.parse` has security vulnerabilities (cve spoofing). `crypto.createCipher` uses insecure key derivation.
- **Fix**: Use WHATWG `new URL()` and `crypto.createCipheriv()`.

---

### 10. Forgetting Uncaught Exception Handlers
- **Failure Mode**: An unhandled exception or rejection crashes the entire process without flushing logs or terminating in-flight requests cleanly.
- **Fix**: Handle gracefully with process listeners, initiate graceful drain, and exit with code 1.
