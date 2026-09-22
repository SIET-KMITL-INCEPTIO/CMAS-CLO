# The Four Questions

Every brief answers these four. They are ordered: a good answer to Q3 is impossible without Q1 and Q2, and Q4 is only checkable once Q3 has numbers in it.

---

## Q1 — What is being created?

Describe the **capability**, not the artifact. "A password reset system" names a folder; "a way for a user who lost their password to set a new one without knowing the old one" names a behavior you can argue about.

Three tests for a usable Q1 answer:

- **Verb, not noun.** What can a person do after this ships that they could not do before?
- **No implementation nouns.** If the sentence contains "table", "endpoint", "component", or "queue", you jumped to design. Those belong in the brief, but not here — fixing the shape of the solution this early hides the alternatives.
- **One sentence.** If it needs two, you probably have two features. Split them and brief each.

**BAD** — "Build a notification system with a queue and a worker."
**BETTER** — "Let a user find out that something happened in the app while they weren't looking at it." *(Now the queue is a decision you get to make, and the real question — which events, how urgent, what channel — is visible.)*

---

## Q2 — For whom?

Name the actor. Then name the actor you are **not** building for, because that is what stops scope creep and wrong defaults.

Ask:

- Who initiates this? Who else sees the result?
- What do they already have — an account, a session, a permission, a device?
- Which adjacent actor is *excluded*? Admins, service accounts, anonymous visitors, other tenants.
- How many of them, roughly? Ten internal users and ten million public ones are not the same feature.

**BAD** — "For users."
**BETTER** — "For a signed-up end user who has lost access to their account. Not admins — they reset via the support console. Not anonymous visitors — an unregistered email must not be able to learn whether an account exists."

That last clause came out of naming the excluded actor. That is the point of Q2.

---

## Q3 — What are the limitations?

The highest-value question and the one most often answered with adjectives. **"Secure", "fast", "simple", and "scalable" are not limitations.** A limitation has a number, a boundary, or a named forbidden case.

Convert every adjective into something testable:

| Adjective | Ask | Limitation |
| --- | --- | --- |
| "secure" | Against whom, doing what? | "An attacker with the email address cannot confirm the account exists." |
| "fast" | How fast, at what percentile, under what load? | "p95 under 300 ms at 50 req/s." |
| "simple" | Simple for whom, measured how? | "Two screens, no new account concepts introduced." |
| "scalable" | To what number, by when? | "10k users now, 100k in a year; no design that requires a rewrite at 100k." |
| "reliable" | What may fail, and what happens then? | "If the mail provider is down, the request fails visibly; no silent success." |

Limitations come in five kinds. Sweep all five — the ones you forget are the ones that bite:

1. **Rules of the domain** — expiry, uniqueness, ordering, state transitions that are legal or not.
2. **Volume and rate** — how many, how often, per what unit, enforced where.
3. **Environment** — the stack, the framework version, the browsers, the runtime, what already exists that this must fit into.
4. **Forbidden outcomes** — what must never happen, stated as a prohibition. These become your sharpest tests.
5. **Non-goals** — things a reasonable reader would assume are included and are not.

The question bank for pulling these out of a vague ask is [interrogation](interrogation.md).

---

## Q4 — How will the work be proven complete and correct?

Answer this **before** building, not after. Written first, it is a specification; written after, it is a description of whatever got built.

Two separate things, and both are required:

- **Complete** — every stated behavior exists. Checked against the scope list.
- **Correct** — the stated limitations hold, especially the forbidden outcomes. Checked against the rules list.

Code that is complete but not correct is the normal output of an unbriefed agent: every screen present, every rule invented.

A usable Q4 answer names the specific checks. Not "unit tests" — the actual cases, including at least one per forbidden outcome. Detail in [proof-of-done](proof-of-done.md).

**BAD** — "I'll write tests and check it works."
**BETTER** — "Tests: happy path; expired token rejected; token reused rejected; 4th request in an hour rate-limited; unknown email returns the same response and timing as a known one; password below policy rejected."

---

## The failure this prevents

Answering all four badly still produces a document, and the document still feels like planning. The check is whether a second engineer could take your four answers, build from them alone, and produce something you would accept. If they would have to guess, the agent is guessing too — it just does not tell you.
