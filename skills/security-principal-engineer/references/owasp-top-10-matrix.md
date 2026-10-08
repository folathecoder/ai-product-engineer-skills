# OWASP Security Matrix: Web Applications & Agentic Systems

> **Source Foundation**: OWASP Developer Guide (Release v4.1.7), OWASP ASVS 4.0.3, and OWASP Top 10 for LLM & Agentic Applications.

---

## 1. OWASP Top 10 Web Application Security Risks

| ID | Category | Common Weakness Enumeration (CWE) | Principal Engineering Defense |
|---|---|---|---|
| **A01:2021** | **Broken Access Control** | CWE-284, CWE-639 (IDOR), CWE-22 (Path Traversal) | Enforce complete mediation; deny by default; verify authorization per record; never trust client-supplied IDs or roles. |
| **A02:2021** | **Cryptographic Failures** | CWE-259, CWE-327, CWE-330 | Authenticated encryption (AES-256-GCM); CSPRNG for random values; Argon2id/bcrypt for password hashes; TLS 1.3 only; secrets stored in dedicated vaults. |
| **A03:2021** | **Injection** | CWE-89 (SQLi), CWE-78 (Command Injection), CWE-79 (XSS) | Query parameterization (prepared statements); contextual output encoding; input allow-listing; no raw shell invocation. |
| **A04:2021** | **Insecure Design** | CWE-209, CWE-256, CWE-501 | Shift-left threat modeling (STRIDE / Shostack); establish trust boundaries; abuse case modeling; defense-in-depth. |
| **A05:2021** | **Security Misconfiguration** | CWE-16, CWE-611 (XXE), CWE-1004 | Hardened production defaults; disable debug endpoints/stack traces; remove unused features/ports; strict HTTP security headers (OSHP). |
| **A06:2021** | **Vulnerable & Outdated Components** | CWE-1104, CWE-1395 | CycloneDX SBOM generation; automated SCA (Dependency-Check, Dependabot); lockfile pinning; `npm audit` in CI. |
| **A07:2021** | **Identification & Authentication Failures** | CWE-287, CWE-384 (Session Fixation), CWE-307 | Mandatory MFA for sensitive flows; cryptographically random session IDs; HttpOnly/Secure/SameSite cookies; rate-limiting login attempts. |
| **A08:2021** | **Software & Data Integrity Failures** | CWE-829, CWE-494, CWE-502 | Signed commits and releases; Subresource Integrity (SRI); safe deserialization controls; lockfile verification. |
| **A09:2021** | **Security Logging & Monitoring Failures** | CWE-117 (Log Injection), CWE-778 | Centralized structured audit logs; log input validation failures and auth denials; sanitize logs against secret leakage; integrity hashes. |
| **A10:2021** | **Server-Side Request Forgery (SSRF)** | CWE-918 | Strict URL destination allow-lists; block private IP ranges (RFC 1918, link-local, loopback, cloud metadata `169.254.169.254`); DNS rebinding protection. |

---

## 2. OWASP Top 10 for LLM & Agentic Systems

| Risk Category | Threat Vector | Principal Engineering Mitigation |
|---|---|---|
| **Prompt Injection (Direct & Indirect)** | Untrusted user prompts or external tool outputs (web pages, APIs, docs) hijack agent reasoning and instructions. | Treat all tool outputs as untrusted data boundaries. Delimit context with structured XML envelopes. Never concatenate untrusted strings into system instructions. |
| **Excessive Agency / Tool Hijacking** | Over-privileged agent tools (e.g. unrestricted shell, raw SQL execution, broad file write permissions). | Principle of Least Privilege: expose narrow, typed, parameter-whitelisted endpoints. Require explicit Human-in-the-Loop approval for high-blast-radius actions. |
| **Insecure Output Handling** | Agent outputs rendered directly as raw HTML, markdown, or passed directly into system shells. | Contextual output encoding; strict sanitization of markdown/HTML before rendering; parameterize all downstream tool calls. |
| **Sensitive Information Disclosure** | Model leaking API keys, private system prompts, PII, or internal database schemas. | Taint tracking; redact sensitive tokens before context inclusion; isolate user sessions in separate storage contexts. |
| **Supply Chain & Untrusted Skills** | Malicious or compromised marketplace skills and external MCP tool packages. | Verify skill provenance; sign skills; audit third-party tool manifests and schemas before mounting. |
| **Unbounded Resource Consumption (DoS)** | Recursive tool loops or adversarial prompt traps causing token exhaustion or infinite execution. | Set strict execution step limits (max tool calls per turn), context token budgets, and per-tool timeout budgets. |

---

## 3. Live Documentation & Standard Reference Endpoints

- **OpenCRE (Unified Standard Catalog)**: `https://www.opencre.org`
- **OWASP Cheat Sheet Series**: `https://cheatsheetseries.owasp.org`
- **OWASP Application Security Verification Standard (ASVS)**: `https://owasp.org/www-project-application-security-verification-standard/`
- **OWASP Proactive Controls**: `https://owasp.org/www-project-proactive-controls/`
- **OWASP Top 10 for LLM Applications**: `https://owasp.org/www-project-top-10-for-large-language-model-applications/`
