---
name: owasp-top-10-2025
description: >-
  Security review and vulnerability analysis based on the OWASP Top 10 2025. Use this skill when auditing code for security flaws, reviewing authentication, checking for injection vulnerabilities, or ensuring cryptographic correctness. Triggers on tasks involving broken access control, injection attacks, security misconfiguration, cryptographic failures, vibe coding risks, memory management, supply chain security, or resilience failures. Also trigger for: "security review", "find vulnerabilities", "check authentication", "SQL injection", "audit my API", "secure this code", "OWASP compliance", "check my auth", "is this secure", or any security-related code review request.
license: MIT
metadata:
  author: nevinas06 (enhanced by Claude)
  version: "1.0.0"
  source: OWASP Top 10 2025 (compiled 2026)
---

# OWASP Top 10 — 2025 Security Skill

Security review framework based on the OWASP Top 10 2025. Covers 13 vulnerability categories — apply during code review, architecture review, or security audit of any web application or API.

## When to Apply

Reference these guidelines when:
- Auditing existing code for security vulnerabilities
- Reviewing authentication and authorization logic
- Designing new API endpoints or user flows
- Validating cryptographic implementations
- Reviewing third-party dependencies and supply chain
- Checking error handling and logging configurations
- Reviewing AI-assisted or "vibe-coded" outputs

## Vulnerability Categories by Severity

| Priority | Category | Severity | Reference File |
|----------|---------|----------|---------------|
| 1 | Broken Access Control | CRITICAL | [broken-access-control](references/broken-access-control.md) |
| 2 | Cryptographic Failures | CRITICAL | [cryptographic-failures](references/cryptographic-failures.md) |
| 3 | Injection | CRITICAL | [injection](references/injection.md) |
| 4 | Authentication Failures | HIGH | [authentication-failures](references/authentication-failures.md) |
| 5 | Security Misconfiguration | HIGH | [security-misconfiguration](references/security-misconfiguration.md) |
| 6 | Insecure Design | HIGH | [insecure-design](references/insecure-design.md) |
| 7 | Software & Data Integrity Failures | HIGH | [software-or-data-integrity-failures](references/software-or-data-integrity-failures.md) |
| 8 | Software Supply Chain Failures | HIGH | [software-supply-chain-failures](references/software-supply-chain-failures.md) |
| 9 | Security Logging & Alerting Failures | MEDIUM | [security-logging-and-alerting-failures](references/security-logging-and-alerting-failures.md) |
| 10 | Memory Management Failures | MEDIUM | [memory-management-failures](references/memory-management-failures.md) |
| 11 | Mishandling of Exceptional Conditions | MEDIUM | [mishandling-of-exceptional-conditions](references/mishandling-of-exceptional-conditions.md) |
| 12 | Lack of Application Resilience | MEDIUM | [lack-of-application-resilience](references/lack-of-application-resilience.md) |
| 13 | Inappropriate Trust in AI-Generated Code | MEDIUM | [vibe-coding](references/vibe-coding.md) |

## Quick Reference

### 1. Broken Access Control (CRITICAL)
- Enforce authorization on every endpoint — not just the UI
- Deny by default; whitelist what is allowed
- Validate ownership: user can only access their own resources
- Never expose internal IDs directly — use indirect references

### 2. Cryptographic Failures (CRITICAL)
- Never use MD5 or SHA-1 for passwords — use bcrypt, Argon2, or scrypt
- Always use HTTPS; set HSTS headers
- Never store secrets in source code or env files committed to git
- Use authenticated encryption (AES-GCM, ChaCha20-Poly1305)

### 3. Injection (CRITICAL)
- Use parameterized queries — never string-concatenate SQL
- Validate and sanitize all inputs server-side
- Use an allow-list for command arguments
- Apply ORM and prepared statements consistently

### 4. Authentication Failures (HIGH)
- Implement MFA for sensitive operations
- Use secure, httpOnly, SameSite cookies for session tokens
- Implement brute-force protection and account lockout
- Invalidate sessions on logout and on password change

### 5. Security Misconfiguration (HIGH)
- Remove default credentials and unused endpoints
- Set security headers: CSP, X-Frame-Options, HSTS
- Disable directory listing and debug modes in production
- Keep software patched and dependencies up to date

### 6. Insecure Design (HIGH)
- Threat model during design phase — not after
- Apply principle of least privilege at design level
- Design rate limiting, input validation, and error handling upfront
- Never design features that store more data than needed

### 7. Software & Data Integrity Failures (HIGH)
- Verify integrity of CI/CD pipelines and build artifacts
- Use signed commits and verified dependency hashes
- Never deserialize untrusted data without validation
- Validate webhook payloads with HMAC signatures

### 8. Supply Chain Failures (HIGH)
- Pin dependency versions in lockfiles
- Audit `npm audit` / `pip audit` regularly
- Review new dependencies before adding them
- Prefer minimal, well-maintained packages

### 9. Security Logging & Alerting (MEDIUM)
- Log authentication events, access control failures, and input validation errors
- Never log passwords, tokens, or PII
- Set up alerts for anomalous patterns (many 401s, unusual data access)
- Ensure logs are tamper-evident and centralized

### 10. Memory Management Failures (MEDIUM)
- Avoid unsafe language constructs causing buffer overflows
- Release resources in `finally` blocks or use RAII patterns
- Validate all array bounds and pointer arithmetic
- Use memory-safe languages or sanitizers in C/C++

### 11. Mishandling Exceptional Conditions (MEDIUM)
- Never swallow exceptions silently — log and handle explicitly
- Return safe error responses that don't leak stack traces
- Distinguish between operational errors (4xx) and bugs (5xx)
- Test all error paths, not just happy paths

### 12. Lack of Application Resilience (MEDIUM)
- Implement circuit breakers for downstream dependencies
- Use retries with exponential backoff
- Design graceful degradation for partial failures
- Load-test and chaos-test before production

### 13. Inappropriate Trust in AI-Generated Code (MEDIUM)
- Review all AI-generated code as if it came from an untrusted source
- Validate AI outputs against security requirements explicitly
- Never deploy AI-generated code without human security review
- Test AI outputs for injection, access control, and logic flaws

## How to Use

1. Identify the vulnerability category matching the review task
2. Open the corresponding reference file for detailed patterns and examples
3. Apply the checklist items to the code under review
4. Flag findings with severity: CRITICAL / HIGH / MEDIUM

```
broken-access-control.md   — Authorization logic review
injection.md               — SQL, command, template injection
authentication-failures.md — Login, session, MFA patterns
```

## Reference Files

| File | Review When |
|------|------------|
| [broken-access-control](references/broken-access-control.md) | Any authorization or ownership check |
| [cryptographic-failures](references/cryptographic-failures.md) | Password hashing, encryption, HTTPS |
| [injection](references/injection.md) | Database queries, shell commands, templates |
| [authentication-failures](references/authentication-failures.md) | Login, session management, MFA |
| [security-misconfiguration](references/security-misconfiguration.md) | Server config, headers, debug settings |
| [insecure-design](references/insecure-design.md) | Architecture and threat modeling |
| [software-or-data-integrity-failures](references/software-or-data-integrity-failures.md) | CI/CD, deserialization, webhooks |
| [software-supply-chain-failures](references/software-supply-chain-failures.md) | Dependencies, packages, lockfiles |
| [security-logging-and-alerting-failures](references/security-logging-and-alerting-failures.md) | Logging and monitoring |
| [memory-management-failures](references/memory-management-failures.md) | Low-level memory and resource handling |
| [mishandling-of-exceptional-conditions](references/mishandling-of-exceptional-conditions.md) | Error handling and exception paths |
| [lack-of-application-resilience](references/lack-of-application-resilience.md) | Fault tolerance and reliability |
| [vibe-coding](references/vibe-coding.md) | AI-assisted code review |