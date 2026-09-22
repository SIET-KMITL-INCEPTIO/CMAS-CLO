name: lack-of-application-resilience description: > Use when the user asks about application availability, denial of service (DoS), resource exhaustion, circuit breakers, bulkheads, graceful degradation, chaos engineering, rate limiting, quotas, failover, load testing, input fuzzing resilience, dependency failure handling, botnet blocking, or proof-of-work defenses. Trigger when an application crashes or becomes unavailable under unexpected load or adversarial conditions, or when designing for high availability. Do NOT use for memory-specific crashes — use memory-management-failures skill for those. license: Apache-2.0 metadata: author: example-org version: "1.1" owasp_id: X01:2025 last_updated: "2025-01-01"

---

# X01:2025 Lack of Application Resilience

## Description

This category represents a systemic weakness in how applications respond to stress, failures, and edge cases that they are unable to recover from. When an application does not gracefully handle, withstand, or recover from unexpected conditions, resource constraints, and other adverse events it can easily result in availability issues (most commonly), but also data corruption, sensitive data disclosure, cascading failures, and/or bypasses of security controls.

Furthermore, [X02:2025 Memory Management Failures](https://owasp.org/Top10/2025/X01_2025-Next_Steps/#x022025-memory-management-failures) can also lead to failure of the application or even the entire system.

## Example Attack Scenarios

**Scenario #1:** Attackers intentionally consume application resources to trigger failures within the system, resulting in denial of service. This could be memory exhaustion, filling up disk space, CPU saturation, or opening endless connections.

**Scenario #2:** Input fuzzing that leads to crafted responses that break application business logic.

**Scenario #3:** Attackers focus on the application's dependencies, taking down APIs or other external services, and the application is unable to continue.

## How to Prevent

1. Add limits, quotas, and failover functionality, paying special attention to the most resource-consuming operations.
2. Identify resource-intensive pages and plan ahead: reduce attack surface by not exposing unneeded functions that require a lot of resources (e.g. CPU, memory) to unknown or untrusted users.
3. Perform strict input validation with allow-lists and size limitations, then test thoroughly.
4. Limit response sizes, and never send raw responses back to the client (process on the server side).
5. Default to safe/closed (never open), deny by default and roll back if there's an error.
6. Avoid blocking synchronous calls in request threads (use asynchronous/non-blocking calls, have timeouts, have concurrency limits, etc.).
7. Carefully test your error handling functionality.
8. Implement resilience patterns such as circuit breakers, bulkheads, retry logic, and graceful degradation.
9. Do performance and load testing; add chaos engineering if you have the risk appetite for it.
10. Implement and architect for redundancy where reasonable and affordable.
11. Implement monitoring, observability, and alerting.
12. Filter invalid sender addresses in accordance with RFC 2267.
13. Block known botnets by fingerprints, IPs, or dynamically by behavior.
14. Proof-of-Work: initiate resource-consuming operations at the attacker's side that do not have big impacts on normal users but impact bots trying to send a huge amount of requests. Make the Proof-of-Work more difficult if the general load of the system raises, especially for systems that are less trustworthy or appear to be bots.
15. Limit server-side session time based on inactivity and a final timeout.
16. Limit session-bound information storage.