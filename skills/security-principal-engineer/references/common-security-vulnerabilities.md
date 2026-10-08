# Top 25 Application Security Vulnerabilities & Canonical Fixes

> **Primary Sources**: OWASP Developer Guide (Release v4.1.7, Sections 2, 4, 12), OWASP Top 10 (2021), and Common Weakness Enumeration (CWE).

---

### 1. Insecure Direct Object References (IDOR / Broken Access Control) — CWE-639
- **Failure Mode**: The application fetches records using client-supplied IDs (`/api/invoices?id=1024`) without verifying that the authenticated user owns that invoice.
- **Fix**: Scope all database queries directly to the authenticated user's session identifier or tenant organization.

---

### 2. SQL Injection (SQLi) — CWE-89
- **Failure Mode**: Concatenating untrusted user input directly into SQL strings (`"SELECT * FROM users WHERE email = '" + email + "'"`).
- **Fix**: Use parameterized queries, prepared statements with typed bind variables, or modern ORM abstractions.

---

### 3. Server-Side Request Forgery (SSRF) — CWE-918
- **Failure Mode**: Fetching arbitrary user-supplied URLs without validation, allowing attackers to query internal VPC services or the cloud metadata endpoint (`http://169.254.169.254/latest/meta-data/`).
- **Fix**: Validate URLs against a strict domain allow-list, resolve DNS, and reject all private, loopback, and link-local IP addresses.

---

### 4. Cross-Site Scripting (Stored & Reflected XSS) — CWE-79
- **Failure Mode**: Rendering unsanitized user content directly into HTML templates, allowing attackers to inject malicious `<script>` tags or inline handlers.
- **Fix**: Contextually encode all output data (HTML entity encoding) and sanitize rich text with an allow-listed sanitizer (DOMPurify).

---

### 5. OS Command Injection — CWE-78
- **Failure Mode**: Passing unescaped strings into shell execution wrappers (`exec("convert " + filename + " out.png")`).
- **Fix**: Use `execFile` or `spawn` with an argument array and explicitly set `{ shell: false }`.

---

### 6. Prototype Pollution — CWE-1321
- **Failure Mode**: Deep-merging untrusted JSON payloads without filtering keys, allowing attackers to overwrite `__proto__` and alter global Object prototypes.
- **Fix**: Freeze prototypes (`Object.freeze(Object.prototype)`), reject dangerous keys (`__proto__`, `constructor`, `prototype`), or use `Object.create(null)`.

---

### 7. Path Traversal — CWE-22
- **Failure Mode**: Constructing file paths from user inputs (`path.join('/uploads', filename)`), allowing attackers to pass `../../etc/passwd`.
- **Fix**: Generate random UUID storage keys, strip path separators, and verify the canonical path starts with the intended base directory using `path.resolve()`.

---

### 8. Cross-Site Request Forgery (CSRF) — CWE-352
- **Failure Mode**: State-changing endpoints accept requests without verifying that the request originated from the legitimate web application.
- **Fix**: Enforce anti-CSRF synchronizer tokens, verify `Origin` and `Host` request headers, and set `SameSite=Lax` or `Strict` on all authentication cookies.

---

### 9. Broken Authentication & Session Fixation — CWE-384
- **Failure Mode**: Reusing the same session token before and after a user logs in, allowing an attacker who pre-planted a session ID to hijack the account.
- **Fix**: Destroy the existing session and generate a fresh, cryptographically random session ID upon successful login.

---

### 10. Weak Password Hashing — CWE-916
- **Failure Mode**: Hashing passwords with fast algorithms like MD5, SHA-1, or plain SHA-256 without memory-hard key stretching.
- **Fix**: Use modern memory-hard password hashing algorithms: **Argon2id** (recommended) or **bcrypt** (cost >= 12).

---

### 11. Sensitive Data Exposure in Logs — CWE-532
- **Failure Mode**: Printing request bodies or full user objects into application logs, writing passwords, tokens, and credit card numbers to disk.
- **Fix**: Implement automatic log redaction middleware to scrub sensitive keys before formatting logs.

---

### 12. Log Injection (CRLF) — CWE-117
- **Failure Mode**: Writing unsanitized user inputs to log files, allowing attackers to inject carriage return and line feed characters (`\r\n`) to forge log entries.
- **Fix**: Sanitize or strip all carriage return and newline characters from user-controlled values before logging.

---

### 13. Regular Expression Denial of Service (ReDoS) — CWE-1333
- **Failure Mode**: Evaluating evil regular expressions with overlapping greedy quantifiers (`/(a+)+$/`) on long user strings, causing CPU lockup.
- **Fix**: Avoid nested quantifiers, validate string length before regex evaluation, or use non-backtracking regex engines.

---

### 14. Unvalidated Redirects and Forwards — CWE-601
- **Failure Mode**: Redirecting users based on an unvalidated query parameter (`/login?returnUrl=https://evil.com`).
- **Fix**: Restrict redirect destinations to relative paths starting with a single slash (`/`) or validate against an exact hostname allow-list.

---

### 15. Insecure Direct File Uploads — CWE-434
- **Failure Mode**: Allowing users to upload executable files (`.php`, `.jsp`, `.exe`, `.html`) directly into the public web root.
- **Fix**: Validate file headers (magic bytes), rename uploaded files with random UUIDs, store files outside the web root (e.g. S3), and serve with `Content-Disposition: attachment`.

---

### 16. Clickjacking — CWE-1021
- **Failure Mode**: Allowing an application to be embedded inside a transparent iframe on an attacker's website to trick users into clicking buttons.
- **Fix**: Send `Content-Security-Policy: frame-ancestors 'none'` (or `'self'`) and `X-Frame-Options: DENY`.

---

### 17. Information Disclosure via Stack Traces — CWE-209
- **Failure Mode**: Uncaught exceptions display database connection strings, table schemas, and file paths to end users.
- **Fix**: Catch exceptions at top-level error boundaries, log technical details internally, and return generic error responses (`"An unexpected error occurred"`).

---

### 18. Hardcoded Secrets in Codebases — CWE-798
- **Failure Mode**: Committing AWS keys, Stripe secret keys, or database passwords to git repositories.
- **Fix**: Store all credentials in secrets managers or `.env.local` (git-ignored) and use pre-commit secret scanners (Gitleaks).

---

### 19. Insecure JWT Implementation (Algorithm Confusion) — CWE-347
- **Failure Mode**: Accepting tokens with `alg: "none"` or confusing symmetric HMAC keys with asymmetric RSA public keys.
- **Fix**: Hardcode the expected signature verification algorithm (e.g. `algorithms: ['RS256']`) and reject unverified tokens.

---

### 20. Missing Rate Limiting on Authentication Endpoints — CWE-307
- **Failure Mode**: Allowing unlimited login or password-reset attempts, enabling automated credential-stuffing attacks.
- **Fix**: Enforce IP-based and username-based rate limits with exponential backoff on all authentication endpoints.

---

### 21. Insufficient Cryptographic Randomness — CWE-338
- **Failure Mode**: Using `Math.random()` to generate CSRF tokens, password reset links, or cryptographic salts.
- **Fix**: Always use cryptographically secure random number generators (`crypto.getRandomValues()` or `crypto.randomBytes()`).

---

### 22. XML External Entity (XXE) Injection — CWE-611
- **Failure Mode**: Parsing XML documents with external entity resolution enabled, allowing attackers to read server files.
- **Fix**: Disable DTDs (External Document Type Definitions) and external entity resolution in XML parsers.

---

### 23. Race Conditions in Business Logic — CWE-362
- **Failure Mode**: Checking an account balance and deducting funds in separate non-atomic operations, enabling double-spending attacks.
- **Fix**: Use database transactions with pessimistic locking (`SELECT ... FOR UPDATE`) or serializable isolation levels.

---

### 24. Unchecked Dependency Vulnerabilities (Supply Chain) — CWE-1395
- **Failure Mode**: Deploying applications with known vulnerabilities in third-party npm/pip packages.
- **Fix**: Run `npm audit` or Dependency-Check in CI and maintain CycloneDX SBOMs.

---

### 25. Prompt & Tool Injection in AI Systems — CWE-1426
- **Failure Mode**: Untrusted external data overrides AI agent system instructions and tricks the model into executing unauthorized tool calls.
- **Fix**: Delimit untrusted data boundaries with XML tags, enforce least-privilege tool schemas, and require human-in-the-loop confirmation for destructive operations.
