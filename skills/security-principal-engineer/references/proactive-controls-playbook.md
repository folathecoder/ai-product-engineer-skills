# OWASP Top 10 Proactive Controls Playbook

> **Primary Sources**: OWASP Developer Guide (Release v4.1.7, Section 5.1.1 & Section 12) and OWASP Top 10 Proactive Controls Project.

---

## Control 1 (C1): Implement Access Control
- **Core Stance**: **Deny by default**. If a user or process is not explicitly granted permission to an object, access is denied.
- **Complete Mediation**: Enforce authorization checks on every request, including AJAX, Server Actions, and internal API calls.
- **Pattern**: Centralize access decisions in a single domain logic layer rather than scattered across individual UI components:
  ```ts
  export async function authorize(userId: string, action: Action, resource: Resource) {
    const permissions = await getEffectivePermissions(userId)
    if (!permissions.can(action, resource)) {
      throw new ForbiddenError('Access Denied: Insufficient Privileges')
    }
  }
  ```

---

## Control 2 (C2): Use Cryptography the Proper Way
- **Golden Rule**: **Never create custom cryptographic algorithms**. Always use peer-reviewed, standard cryptographic libraries.
- **Storage Protection**: Authenticated symmetric encryption using **AES-256-GCM** with unique initialization vectors (IVs) per operation. Never reuse an IV for a fixed key.
- **Password Storage**: Modern memory-hard key derivation functions: **Argon2id** (recommended), **bcrypt** (work factor >= 12), or **PBKDF2** (SHA-256, >= 600,000 iterations). Never use raw SHA-256, MD5, or unsalted hashes.
- **Entropy & Randomness**: Use Cryptographically Secure Pseudo-Random Number Generators (CSPRNG): `crypto.getRandomValues()` or `crypto.randomBytes()`.

---

## Control 3 (C3): Validate All Input & Handle Exceptions
- **Input Allow-Listing**: Validate incoming data for type, length, format, and range. Prefer strict allow-lists over block-lists.
- **Canonicalization Before Validation**: Decode character sets (UTF-8) and normalize paths before executing validation checks to eliminate double-encoding and `%00` null byte bypasses.
- **Fail Safe / Secure**: All validation rejections must abort processing immediately.
- **Error Handling**: Catch exceptions gracefully; never leak stack traces, database query strings, or server paths to end users.

---

## Control 4 (C4): Address Security from the Start
- Integrate security into every sprint: threat modeling at design, static analysis in CI, security champions embedded in agile teams.
- Security requirements must be tracked alongside functional user stories.

---

## Control 5 (C5): Secure by Default Configurations
- New services, databases, and users must start in the most restricted possible state.
- Change or disable all vendor-supplied default passwords and accounts before deployment.
- Disable unused ports, protocols, and debugging endpoints (`/debug`, `/actuator`, `/swagger` in production).

---

## Control 6 (C6): Keep Your Components Secure
- Generate and maintain a **Software Bill of Materials (SBOM)** using the **OWASP CycloneDX** standard.
- Enforce automated Software Composition Analysis (SCA) in CI pipelines (Dependency-Check, Dependabot).
- Pin dependencies in lockfiles; review changelogs and audit security advisories before major upgrades.

---

## Control 7 (C7): Implement Digital Identity
- **Centralized Authentication**: Segregate authentication into dedicated, audited auth flows.
- **Session ID Integrity**: Generate session identifiers using CSPRNG with at least 128 bits of entropy.
- **Cookie Flags**: Store session identifiers exclusively in cookies with `HttpOnly`, `Secure`, and `SameSite=Lax/Strict`.
- **Session Inactivity Timeout**: Terminate idle sessions automatically (e.g. 15–30 minutes for high-risk applications).
- **Session Regeneration**: Issue a fresh session ID immediately upon login and privilege elevation to prevent session fixation attacks.

---

## Control 8 (C8): Leverage Browser Security Features
- **Content Security Policy (CSP)**:
  - `default-src 'self'`
  - `script-src 'self' 'nonce-{random}'`
  - `frame-ancestors 'none'` (prevents clickjacking)
- **HTTP Security Response Headers**:
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## Control 9 (C9): Implement Security Logging and Monitoring
- Log all authentication failures, access control denials, administrative privilege elevations, and validation exceptions.
- **Log Injection Defense**: Strip CRLF characters (`\r`, `\n`) from all logged user data.
- **Redaction**: Never log passwords, API keys, session tokens, or personal identifiers (PII).
- Forward logs to a tamper-proof centralized logging service (SIEM).

---

## Control 10 (C10): Stop Server-Side Request Forgery (SSRF)
- Maintain an explicit allow-list of permitted target hostnames and protocols (`https:` only).
- Resolve target hostnames and inspect IP addresses before sending requests.
- Strictly block all private IP addresses (RFC 1918), loopback (`127.0.0.1`), link-local, and cloud metadata services (`169.254.169.254`).
