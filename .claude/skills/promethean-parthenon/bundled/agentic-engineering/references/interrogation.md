# Interrogation

The framing questions get answered fluently and emptily. Interrogation is what makes the answers load-bearing: attack each one until it yields rules with numbers, boundaries, and named forbidden cases.

Work the banks below in order. Skip a bank only when you can say why it does not apply — "no concurrency here" is a decision; silence is an omission.

---

## How to run it

- **Ask what happens at the edges, never in the middle.** The middle is what the agent will get right anyway.
- **For every duration, ask what happens after it.** For every count, ask what happens above it. For every action, ask what happens when it is repeated.
- **Prefer questions whose answers change code.** "Should the button be blue?" does not belong here.
- **Answer it yourself when the answer is obvious to a careful engineer**, and write the answer down. Ask the user only when the trade-off is real. A brief full of questions is not a brief.
- **Stop when a full pass yields nothing new**, not when you get tired. Two or three passes is normal for anything touching auth, money, or other people's data.

---

## Bank 1 — Lifetime and reuse

The seed of this skill, and the one that generalizes furthest. Applies to any token, link, session, invite, code, draft, lock, or cached value.

- How long is it valid? What happens at the moment it expires — rejected, refreshed, silently ignored?
- Can it be used twice? What happens on the second use?
- Can a second one be issued while the first is alive? Does issuing invalidate the first, or do both work?
- Is it revocable before expiry? By whom, and through what surface?
- Where is it stored, and is the stored form the same as the transmitted form?
- What is visible in a URL, a log line, or an error message? What ends up in browser history or a proxy log?

## Bank 2 — Volume and abuse

- How many times per minute, per hour, per actor? Enforced per what key — user, email, IP, session?
- What is the response when the limit is hit — error, silent drop, delay?
- What does an attacker gain by repeating this action cheaply? What does it cost you — email spend, SMS spend, database growth, a queue backing up?
- Does the response leak whether the target exists? Do the response *times* leak it, even when the bodies match?
- What is the largest input accepted — string length, file size, array length, page size, nesting depth?

## Bank 3 — Identity and permission

- Who is allowed to perform this? Verified where — the client, the route, the query?
- Can actor A act on actor B's resource? What is the exact check that prevents it, and does it run before or after the data is fetched?
- Does the answer change across tenants, organizations, or roles?
- Does performing this action change the actor's own session state — logged out, elevated, downgraded?
- What is the behavior for a logged-out caller, an expired session, a valid session on a deleted account?

## Bank 4 — State and concurrency

- What happens if this runs twice at the same time for the same subject? Which one wins?
- Is the operation idempotent? If the client retries after a timeout, does the effect double?
- What is the ordering guarantee, if any? What if a later event arrives first?
- Which parts must succeed or fail together? Where is the transaction boundary, and what sits outside it — an email, a webhook, a third-party call?
- What is the state machine? List the legal states and the legal transitions; anything unlisted is a forbidden outcome and a test.

## Bank 5 — Failure and recovery

- What are the external dependencies, and what is the behavior when each is down or slow?
- Which failures are retried, how many times, with what backoff? Which are surfaced immediately?
- What does the user see when it fails — and does that message tell an attacker anything?
- Can the system end up half-done? If yes, what cleans it up, and when?
- Is the failure observable by anyone other than the user who hit it? What is logged, and does the log contain secrets?

## Bank 6 — Data lifecycle

- What is written, and where does it live after the action completes?
- What is the retention rule — is anything deleted, and by what?
- Does anything need to be backfilled or migrated for existing records? What is the behavior for rows that predate this feature?
- Is this reversible? What does rollback look like once real data exists?
- Is any of it personal data with rules attached — export, deletion, residency?

## Bank 7 — Surfaces and integration

- What consumes this — a UI, another service, a job, a third party? Does the contract need to stay backward compatible?
- What already exists in this codebase that does part of the job? Extending the wrong thing and building a duplicate are both real risks here.
- What is the deployment story — a flag, a migration, an env var, a secret? Who sets them?
- What breaks if this ships and the client is a stale cached bundle?

---

## Domain add-ons

Quick extras once the banks above are done, when the work touches these areas.

| Domain | Also ask |
| --- | --- |
| **Auth / credentials** | Password policy, hashing algorithm and cost, session invalidation on change, second-factor interaction, lockout thresholds and lockout as a DoS vector. |
| **Money** | Currency and rounding, decimal type, idempotency key on every charge, partial refunds, what happens between charge and fulfillment failing, reconciliation. |
| **File upload** | Type allowlist enforced by content, size cap, storage location, filename sanitization, whether the file is served back to other users, virus/AV handling. |
| **Search / list** | Page size cap, sort stability, what an empty result renders, whether results cross a permission boundary, injection through the filter parameters. |
| **Background jobs** | At-least-once versus at-most-once, dead-letter path, visibility of failures, what happens on a redeploy mid-job. |
| **Third-party API** | Rate limits and quotas, timeout, sandbox versus live, key rotation, behavior when their schema changes. |

---

## Turning answers into rules

An interrogation answer is only useful once it is written as a rule that a test can check.

**BAD** — "We should probably limit reset requests."
**BETTER** — "Max 3 reset requests per email address per hour. The 4th returns the same generic success response as the 1st; no email is sent."

The second version fixes the number, the key, the response, and the side effect. It is also, without further work, a test case — which is exactly what [proof-of-done](proof-of-done.md) needs.
