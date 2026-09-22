name: mishandling-of-exceptional-conditions description: > Use when the user asks about exception handling, error handling, try-catch patterns, global exception handlers, fail-closed design, transaction rollback, race conditions, state corruption from partial failures, sensitive error message disclosure, resource leaks on exception, or resilience against unexpected runtime conditions. Trigger when reviewing code that catches exceptions but does nothing, exposes stack traces to users, or fails to roll back partial transactions. Do NOT use for general input validation questions — those belong in the injection skill. license: Apache-2.0 metadata: author: example-org version: "1.1" owasp_id: A10:2025 last_updated: "2025-01-01"

---

# A10:2025 Mishandling of Exceptional Conditions

## Description

Mishandling exceptional conditions in software happens when programs fail to prevent, detect, and respond to unusual and unpredictable situations, which leads to crashes, unexpected behavior, and sometimes vulnerabilities. This can involve one or more of the following three failings: the application doesn't prevent an unusual situation from happening; it doesn't identify the situation as it is happening; and/or it responds poorly or not at all to the situation afterwards.

Exceptional conditions can be caused by missing, poor, or incomplete input validation; late or high-level error handling instead of handling at the functions where they occur; unexpected environmental states such as memory, privilege, or network issues; inconsistent exception handling; or exceptions that are not handled at all, allowing the system to fall into an unknown and unpredictable state. Any time an application is unsure of its next instruction, an exceptional condition has been mishandled.

Many different security vulnerabilities can result from mishandling exceptional conditions, such as logic bugs, overflows, race conditions, fraudulent transactions, or issues with memory, state, resource, timing, authentication, and authorization.

## Example Attack Scenarios

**Scenario #1:** Resource exhaustion via mishandling of exceptional conditions (Denial of Service). The application catches exceptions when files are uploaded, but doesn't properly release resources afterward. Each new exception leaves resources locked or otherwise unavailable, until all resources are used up.

**Scenario #2:** Sensitive data exposure via improper handling of database errors that reveal the full system error to the user. The attacker continues to force errors in order to use the sensitive system information to craft a better SQL injection attack. The error messages are reconnaissance.

**Scenario #3:** State corruption in financial transactions caused by an attacker interrupting a multi-step transaction via network disruptions. Imagine the transaction order was: debit user account → credit destination account → log transaction. If the system doesn't properly roll back the entire transaction (fail closed) when there is an error partway through, the attacker could potentially drain the user's account, or exploit a race condition that allows sending money to the destination multiple times.

## How to Prevent

1. Plan for exceptional conditions (expect the worst). Catch every possible system error directly at the place where it occurs and handle it meaningfully. As part of the handling, throw an error to inform the user in an understandable way, log the event, and issue an alert if justified. Also have a global exception handler in place as a safety net. Ideally, add monitoring and observability tooling that watches for repeated errors or patterns indicating an ongoing attack.
2. Catching and handling exceptional conditions ensures that the underlying infrastructure is not left to deal with unpredictable situations. If you are partway through a transaction of any kind, roll back every part of the transaction and start again (fail closed). Attempting to recover a transaction partway through is often where unrecoverable mistakes are made.
3. Wherever possible, add rate limiting, resource quotas, throttling, and other limits to prevent exceptional conditions in the first place. Nothing in information technology should be limitless, as this leads to a lack of application resilience, denial of service, successful brute force attacks, and extraordinary cloud bills.
4. Include strict input validation (with sanitization or escaping for potentially hazardous characters), centralized error handling, logging, monitoring, and alerting, and a global exception handler. One application should have one function for handling exceptional conditions, performed the same way each time.
5. If possible, your entire organization should handle exceptional conditions in the same way, making it easier to review and audit code for errors in this important security control.