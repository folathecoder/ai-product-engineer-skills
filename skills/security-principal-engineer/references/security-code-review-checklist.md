# Principal Application Security Code Review Checklist

> **Purpose**: A comprehensive, severity-ranked AppSec review checklist derived directly from the OWASP Developer Guide (Release v4.1.7) and OWASP ASVS 4.0.3. Used to audit pull requests, secure application code, and prevent vulnerabilities before production deployment.

---

## Severity Classification

| Level | Definition | Merge Policy |
|---|---|---|
| **P0 — Critical** | Remote code execution, SQLi, unauthenticated data breach, SSRF to metadata, or secret leak. | **BLOCKER**. Immediate halt. Never merge. |
| **P1 — High** | Broken access control (IDOR), persistent XSS, missing CSRF defense, or path traversal. | **BLOCKER**. Must fix before production release. |
| **P2 — Medium** | Missing CSP headers, stack traces in error responses, insecure session cookie attributes. | **ACTIONABLE**. Address in current PR. |
| **P3 — Low / Nit** | Informative error messaging, missing defense-in-depth header, or dependency updates. | **SUGGESTION**. Non-blocking. |

---

## 1. P0 — Critical (Immediate Exploitation & Breach Vectors)

### 🚨 Authentication, Authorization & Secrets
- [ ] **Hardcoded Secrets**: Ensure zero API keys, private keys, database passwords, or JWT secrets exist in source code or configuration files. Secrets must be retrieved from environment vaults or secrets managers.
- [ ] **IDOR & Broken Access Control**: Verify **every** database lookup by ID (`/api/documents/:id`) enforces ownership or role authorization:
  ```ts
  // ❌ VULNERABLE: Direct lookup without tenant verification
  const doc = await db.documents.findUnique({ where: { id: req.params.id } })

  // ✅ SECURE: Scoped to authenticated user/organization
  const doc = await db.documents.findFirst({
    where: { id: req.params.id, organizationId: session.orgId }
  })
  if (!doc) throw new NotFoundError()
  ```
- [ ] **Zero-Trust Server Actions / Endpoints**: Verify every mutation re-authenticates and re-authorizes the caller. Never trust client-supplied user IDs or roles.

### 🚨 Injection & Execution
- [ ] **SQL / NoSQL Injection**: Verify all database queries use strongly typed parameterized queries or ORM abstractions. Concatenating raw user strings into SQL queries is strictly prohibited.
- [ ] **OS Command Injection**: Prohibit passing untrusted user input to `exec`, `eval`, `system`, or shell commands. Use parameter arrays with `{ shell: false }`.
- [ ] **SSRF to Private Infrastructure**: Verify URL fetch requests validate destinations against an allow-list and strictly reject internal IP ranges:
  - `127.0.0.0/8` (Loopback)
  - `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (RFC 1918 Private networks)
  - `169.254.169.254` (Cloud Instance Metadata Service)

---

## 2. P1 — High (Access Control, Cross-Site Attacks & File Safety)

### 🛡️ Cross-Site Attacks (XSS & CSRF)
- [ ] **Cross-Site Scripting (XSS)**:
  - Verify untrusted data is contextually encoded (HTML entity, JavaScript attribute, or URL encoding) before rendering.
  - Ban `dangerouslySetInnerHTML` unless passed through an allow-listed HTML sanitizer (DOMPurify).
- [ ] **Cross-Site Request Forgery (CSRF)**:
  - Verify non-idempotent HTTP methods (`POST`, `PUT`, `DELETE`) require anti-CSRF synchronizer tokens or strict `SameSite=Lax/Strict` cookies.
  - Server Actions in modern frameworks must maintain Origin/Host verification.

### 📁 File Upload & Path Traversal
- [ ] **Path Traversal Defense**: Reject `../`, `..\`, null bytes (`%00`), and decoded variants in file paths. Generate randomized cryptographic storage names (UUIDv4) rather than using user-supplied filenames.
- [ ] **Safe File Uploads**: Verify file uploads validate content headers (magic bytes), restrict allowed extensions, disable execution privileges in upload storage, and store files outside the public web root.

### 🍪 Session & Token Security
- [ ] **Session Cookie Attributes**: Ensure session cookies are flagged with `HttpOnly` (blocks XSS access), `Secure` (HTTPS only), and `SameSite=Lax` or `Strict`.
- [ ] **JWT Validation Discipline**:
  - Reject tokens specifying the `none` algorithm (`alg: "none"`).
  - Explicitly restrict allowed algorithms (e.g. only `RS256` or `EdDSA`).
  - Validate issuer (`iss`), audience (`aud`), and expiration (`exp`).

---

## 3. P2 — Medium (Configuration, Error Handling & Logging)

### ⚙️ Hardening & Information Disclosure
- [ ] **No Stack Traces in Production**: Ensure global error handlers return generic, non-informative error messages to clients. Never display stack traces, database schema details, or internal server paths.
- [ ] **Secure HTTP Headers (OSHP)**:
  - `Content-Security-Policy`: Restrict active scripts (`script-src 'self'`), deny untrusted iframes (`frame-ancestors 'none'`).
  - `Strict-Transport-Security`: `max-age=63072000; includeSubDomains; preload`.
  - `X-Content-Type-Options: nosniff`.
- [ ] **Security Logging & Log Injection**:
  - Log access control failures, authentication denials, and unexpected input validation rejections.
  - Sanitize logged strings against CRLF characters (`\r`, `\n`) to prevent log forging/injection.
  - Ensure passwords, tokens, and PII are redacted from logs.

---

## 4. P3 — Low / Polish (Hygiene & Defense-in-Depth)

### 🧹 Supply Chain & Cryptography Hygiene
- [ ] **Dependency Audit**: Run `npm audit` or Dependency-Check; ensure no dependencies have known High/Critical CVEs.
- [ ] **CSPRNG for Random Values**: Ensure tokens, reset codes, and salts use cryptographically secure pseudorandom number generators (`crypto.getRandomValues()` or `crypto.randomBytes()`), never `Math.random()`.
- [ ] **Brute-Force Rate Limiting**: Apply exponential backoff or IP/account rate limits to authentication and password-reset endpoints.
