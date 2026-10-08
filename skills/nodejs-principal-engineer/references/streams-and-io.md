# Node.js Streams & High-Throughput I/O Architecture

> **Purpose**: Authoritative reference for Node.js Streams, Web Streams interop, handling backpressure, and zero-copy Buffer operations.

---

## 1. Backpressure: The Fundamental Law of Streams

When data is read from a fast source (e.g. disk) and written to a slow destination (e.g. network socket), buffers will overflow into RAM unless backpressure is handled.

### Anti-Pattern: Unchecked Manual Writes
```ts
// ❌ WRONG: Ignores backpressure; buffer balloons until OOM!
source.on('data', (chunk) => {
  dest.write(chunk)
})
```

### Idiomatic Pattern A: Modern `pipeline` with `stream/promises`
The `pipeline` API automatically handles backpressure, propagates errors across all streams, and cleans up open file descriptors:

```ts
import { pipeline } from 'node:stream/promises'
import { createReadStream, createWriteStream } from 'node:fs'
import { createGzip } from 'node:zlib'

export async function compressFile(inputPath: string, outputPath: string) {
  await pipeline(
    createReadStream(inputPath),
    createGzip(),
    createWriteStream(outputPath)
  )
}
```

### Idiomatic Pattern B: Async Iterators (`for await...of`)
Node.js readable streams are native async iterables. Iterating over chunks handles backpressure automatically:

```ts
import { createReadStream } from 'node:fs'

async function processLargeLog(filePath: string) {
  const stream = createReadStream(filePath, { encoding: 'utf8' })

  for await (const line of stream) {
    await processLine(line) // Automatically pauses the read stream while awaiting!
  }
}
```

---

## 2. Web Streams API in Modern Node.js

Node.js natively supports WHATWG Web Streams (`ReadableStream`, `WritableStream`, `TransformStream`), matching standard browser APIs:

```ts
import { Readable } from 'node:stream'

// Convert Node stream to Web Stream
const webReadableStream = Readable.toWeb(nodeStream)

// Convert Web Stream to Node stream
const nodeReadableStream = Readable.fromWeb(webStream)
```

---

## 3. High-Performance Buffer Operations

- **Allocation**: Use `Buffer.alloc(size)` (zero-filled, secure). Only use `Buffer.allocUnsafe(size)` in performance-critical code paths where the buffer is guaranteed to be completely overwritten immediately.
- **Subarrays vs Slices**: Use `buf.subarray(start, end)` to create a view over existing memory without copying bytes.
