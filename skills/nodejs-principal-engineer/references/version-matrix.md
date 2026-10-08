# Node.js Version Matrix & Documentation Protocol

> **Rule for Agents**: Always inspect `package.json` (`engines.node`) or runtime environment (`process.versions.node`) to determine the active Node.js release line. If working with a newer Node.js version or unfamiliar native API, query the official Node.js documentation live.

---

## 1. Node.js LTS Release Milestones

| Feature / API | Node.js 20 LTS | Node.js 22 LTS | Node.js 24+ LTS (Current) | Future (26+) |
|---|---|---|---|---|
| **Status** | Maintenance LTS | Active LTS | Active LTS | Upcoming LTS |
| **Permission Model** | Experimental | Stable (`--permission`) | Stable (`process.permission`) | Default security sandbox |
| **Native TypeScript (Type Stripping)** | Not supported | Stable (`--no-strip-types` to disable) | **Enabled by default** | Zero-config native TS |
| **Built-in SQLite (`node:sqlite`)** | Experimental | Stable | Stable | Production-grade local DB |
| **Test Runner (`node:test`)** | Stable | Stable (enhanced mocking) | Stable (parallel execution) | Standard test framework |
| **`module.enableCompileCache()`** | Not available | Stable | Stable by default | Fast startup caching |
| **AsyncLocalStorage `withScope`** | Not available | Experimental | Stable (integrates with `using`) | Context tracking standard |
| **Web Crypto & Fetch** | Stable | Stable | High-throughput optimized | WHATWG standard |

---

## 2. Live Documentation Query Protocol (Never Get Outdated)

When an agent needs authoritative API reference or encounters a newer Node.js release:

1. **Official Node.js API Index**:
   - `https://nodejs.org/docs/latest/api/index.md` (Markdown format)
2. **Version-Matched API Modules**:
   - `https://nodejs.org/docs/latest-v<major>.x/api/<module>.md`
   - *Example*: `https://nodejs.org/docs/latest-v22.x/api/async_context.md`
   - *Example*: `https://nodejs.org/docs/latest/api/stream.md`
3. **Core Topic Reference Endpoints**:
   - Async Context: `https://nodejs.org/docs/latest/api/async_context.md`
   - Streams: `https://nodejs.org/docs/latest/api/stream.md`
   - Permissions: `https://nodejs.org/docs/latest/api/permissions.md`
   - TypeScript Support: `https://nodejs.org/docs/latest/api/typescript.md`
   - Diagnostic Channel: `https://nodejs.org/docs/latest/api/diagnostics_channel.md`
4. **Local Runtime Verification**:
   - Execute lightweight inspection commands: `node -e "console.log(process.versions)"`.
