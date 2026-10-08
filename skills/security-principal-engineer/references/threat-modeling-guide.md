# Threat Modeling & Secure Design Guide

> **Primary Sources**: OWASP Developer Guide (Release v4.1.7, Section 4.1), Threat Modeling Manifesto, and Shostack's Four-Question Framework.

---

## 1. The Core Purpose of Threat Modeling

Threat modeling is an engineering activity that asks: **"What can go wrong, and what are we going to do about it before it gets exploited?"**

It allows software development teams to view applications through "security glasses" early in the design cycle, eliminating vulnerabilities before code is written and avoiding expensive architectural refactors.

---

## 2. Shostack's Four-Question Framework

Every threat modeling exercise revolves around four fundamental questions:

```
┌────────────────────────────────────────────────────────┐
│ 1. What are we working on?                             │
│    Decompose the system: Data Flow Diagrams, boundaries │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ 2. What can go wrong?                                  │
│    Identify threats: STRIDE, LINDDUN, Attack Trees     │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ 3. What are we going to do about that?                 │
│    Remediation strategies: TAME (Transfer, Accept,     │
│    Mitigate, Eliminate)                                │
└───────────────────────────┬────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│ 4. Did we do a good enough job?                        │
│    Retrospective: Verification, test cases, audit      │
└────────────────────────────────────────────────────────┘
```

---

## 3. Question 1: What Are We Working On? (Decomposition)

Decompose the feature or service into:
1. **Processes**: Web servers, background workers, microservices, lambda functions.
2. **Data Stores**: Databases, caches (Redis), S3 buckets, local file systems, browser localStorage.
3. **Data Flows**: HTTP requests, RPC calls, WebSocket streams, queue events.
4. **External Interactors**: Users, third-party APIs, webhooks, admin clients.
5. **Trust Boundaries**: The network or process boundary separating components of differing trust levels (e.g. Browser vs Cloud VPC, DMZ vs Internal Database).

---

## 4. Question 2: What Can Go Wrong? (STRIDE Methodology)

| Threat Category | Security Property Violated | Definition | Example Threat | Canonical Control |
|---|---|---|---|---|
| **S — Spoofing** | Authentication | Impersonating another person or system. | Forging a JWT token or spoofing an internal IP. | Cryptographic signatures, mutual TLS, MFA. |
| **T — Tampering** | Integrity | Maliciously altering data in transit or at rest. | Modifying price parameter in checkout request. | Message Authentication Codes (MAC), TLS, checksums. |
| **R — Repudiation** | Non-Repudiation | Denying having performed an action without proof. | User claiming they did not initiate wire transfer. | Cryptographically verifiable audit logging. |
| **I — Information Disclosure** | Confidentiality | Exposing sensitive data to unauthorized parties. | Leaking database records in public error message. | Encryption at rest/transit, strict access control, DTOs. |
| **D — Denial of Service** | Availability | Degrade or disable access for legitimate users. | ReDoS regex loop or flooding unauthenticated endpoint. | Rate limiting, connection limits, timeout budgets. |
| **E — Elevation of Privilege** | Authorization | Gaining capabilities not normally permitted. | User tampering with role ID in session cookie. | Least privilege, centralized authorization checks. |

---

## 5. Question 3: What Are We Going to Do About That? (TAME Remediation)

When a threat is discovered, apply one of the four **TAME** strategies:

1. **Transfer**: Offload the risk to a specialized third party (e.g. delegating raw credit card handling to Stripe; buying cyber insurance).
2. **Accept**: Formally acknowledge the risk when the likelihood is negligible or the impact is bearable (e.g. public software version strings).
3. **Mitigate**: Implement proactive security controls to reduce likelihood or impact to an acceptable level (e.g. input validation, parameterized queries, rate limits).
4. **Eliminate / Avoid**: Completely remove the risky feature or component (e.g. deprecating unused legacy API endpoints; refusing unauthenticated file uploads).

---

## 6. Question 4: Did We Do a Good Enough Job? (Verification)

Translate threat model findings directly into:
1. **Automated Security Unit Tests**: Tests proving an unauthorized user cannot fetch another user's records.
2. **Negative Test Cases**: Tests sending malformed payloads, unicode overlong encodings, and boundary strings.
3. **Verification Tracking**: Record mitigations in tracking tools (ASVS, Jira) to ensure follow-through.
