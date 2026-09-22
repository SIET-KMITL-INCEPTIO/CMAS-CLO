---
tags: [thinking, framework, mental-model]
aliases: [Thinking Framework, Thorough Thinking]
related: "[SKILL.md](../SKILL.md), [00-INDEX](../00-INDEX.md)"
---

# Thorough-Thinking Framework

Seven habits a genuinely senior person applies before committing to an answer. Run this as a silent internal pass — the goal is a better answer, not a visible audit trail.

← Back to [00-INDEX](../00-INDEX.md)

---

## The Seven Checks

### 1. Think Thoroughly
Don't settle for the first plausible answer. Ask: have I considered this from more than one angle, or did I pattern-match to something familiar?

### 2. Cover All Bases
Before finalizing, ask: what would have to be true for this to go wrong operationally — deployment, rollback, monitoring, ownership? Good answers account for what happens *after* the happy path, not just the happy path itself.

### 3. Consider All Use Cases
Ask: who else touches this besides the primary user? New users, power users, admins, the on-call engineer, the next developer who reads this code, the person with a screen reader. A recommendation that only works for the primary persona isn't finished.

### 4. Think Holistically
Ask: does this decision look good in isolation but cause a problem one level up? Optimizing a single component at the expense of the system it lives in is a classic failure mode for narrow technical thinking.

### 5. Edge-Case Analysis
Ask: what's the rare or extreme version of this scenario? Empty states, zero values, concurrent writes, network partition, malformed input, adversarial input, first-time user, maximum-scale user. Naming the edge case explicitly is the difference between "I considered it" and actually having considered it.

### 6. First-Principles Thinking
Ask: am I recommending this because it's genuinely the right fundamental approach, or just because it's the conventional one? Strip away "that's how it's usually done" and check if the reasoning still holds.

### 7. Pre-Mortem
Ask: imagine this shipped and it failed in six months — what's the most believable reason? If you can name a plausible failure story, that risk is worth addressing now, not after it happens.

---

## When to surface it out loud

Run all seven every time (it's fast). Surface a finding explicitly only when:
- The decision is hard to reverse (architecture, schema, public API, auth, firmware protocol)
- The user is choosing between options and the real tradeoff isn't obvious yet
- The pre-mortem turns up a genuine failure mode worth a one-line flag
- Edge cases would change the recommendation

When surfacing, keep it to one sentence or a short bullet folded into the answer — not a labeled seven-part report.

---

## Application by role

| สาย                 | Most critical checks                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------- |
| Embedded / Firmware | Edge cases (boundary conditions, interrupt timing) + Pre-mortem (what if OTA fails?)      |
| IoT Architect       | Holistic (device to cloud system) + Cover all bases (offline behavior)                    |
| Solutions Architect | First-principles (is this truly the right stack?) + Pre-mortem (vendor risk)              |
| Product Manager     | Consider all use cases (edge-case personas) + Holistic (does this conflict with roadmap?) |
| UX Writer           | Consider all use cases (error state, empty state, first-time user)                        |
| Prompt Engineering  | Edge cases (adversarial input) + Pre-mortem (agent over-acts)                             |
| Silicon Architect   | First-principles (is this genuinely the right structure?) + Pre-mortem (market moved by launch) |
| ASIC / RTL Design   | Edge cases (CDC, reset, X-propagation) + Cover all bases (timing closure, not just simulation) |
| Design Verification | Edge cases (this *is* the job) + Holistic (spec intent vs. RTL behavior)                   |
| Silicon Validation  | Cover all bases (VT corners, process spread) + Consider all use cases (real customer configs) |
| Post-Silicon Test   | Holistic (test time × millions of units) + Pre-mortem (what escapes and returns from the field) |
| Silicon PM          | Pre-mortem (which roadmap assumption breaks first?) + First-principles (SKU stack from real yields) |
| FAE / Support       | Consider all use cases (their board, not our reference) + Cover all bases (isolate before escalating) |

For any role in tracks 7–10, weight the **pre-mortem** hardest. Silicon has no patch — a failure story you can name before tapeout is worth more than the same insight found in the lab.
