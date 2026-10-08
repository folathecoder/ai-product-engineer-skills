# Node.js Event Loop & Concurrency Architecture

> **Purpose**: Deep architectural reference for the libuv event loop, microtask scheduling, multi-threaded offloading (`worker_threads`), and asynchronous context propagation.

---

## 1. Event Loop Phases & Execution Pipeline

The Node.js event loop runs on a single main thread. It iterates through distinct phases managed by `libuv`:

```
┌────────────────────────────────────────────────────────┐
│ 1. Timers Phase                                        │
│    Executes callbacks scheduled by setTimeout/Interval │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ 2. Pending Callbacks Phase                             │
│    Executes I/O callbacks deferred from previous pass  │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ 3. Idle, Prepare Phase                                 │
│    Internal libuv coordination (safe to ignore)        │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ 4. Poll Phase                                          │
│    Calculates blocking duration; polls for new OS I/O; │
│    Executes I/O callbacks                              │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ 5. Check Phase                                         │
│    Executes callbacks scheduled by setImmediate()      │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ 6. Close Callbacks Phase                               │
│    Executes close events (e.g. socket.on('close'))     │
└────────────────────────────────────────────────────────┘
```

---

## 2. The Microtask Priority Rules

Between **every individual callback** executed in the phases above, the microtask queues are drained:

1. **`process.nextTick` Queue**:
   - Runs *immediately* after the currently executing JavaScript operation finishes.
   - Runs **before** the Promise microtask queue.
   - *Danger*: Recursively scheduling `process.nextTick()` completely blocks the event loop and starves all I/O!
2. **Promise Microtask Queue**:
   - Drains after `process.nextTick`.
   - Runs `queueMicrotask()` and Promise `.then()` / `.catch()` / `.finally()` handlers.

---

## 3. Concurrency Decision Matrix

| Mechanism | Architecture | Memory Model | Best Use Case |
|---|---|---|---|
| **Event Loop (Async I/O)** | Single-threaded non-blocking | Shared V8 Heap | Network I/O, database queries, disk operations, web servers. |
| **Worker Threads (`node:worker_threads`)** | Multiple OS threads in single process | Isolated V8 Heaps + `SharedArrayBuffer` | CPU-bound computation, image resizing, heavy JSON/crypto, PDF generation. |
| **Cluster (`node:cluster`)** | Multiple independent Node.js processes | Completely isolated OS processes | Horizontal multi-core scaling for web servers across CPU cores. |
| **Child Process (`node:child_process`)** | External OS process | Isolated external process | Executing system binaries (`ffmpeg`, `git`, `python`). |

---

## 4. Monitoring Event Loop Delay

Use `node:perf_hooks` to detect event loop stalling in production:

```ts
import { monitorEventLoopDelay } from 'node:perf_hooks'

const histogram = monitorEventLoopDelay({ resolution: 20 })
histogram.enable()

setInterval(() => {
  const p99 = histogram.percentile(99) / 1e6 // Convert ns to ms
  if (p99 > 50) {
    console.warn(`[WARNING] High Event Loop Lag: P99 = ${p99.toFixed(2)}ms`)
  }
  histogram.reset()
}, 5000).unref()
```
