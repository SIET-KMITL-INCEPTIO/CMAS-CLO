---
name: agentic-engineering
description: >
  Turns a one-line request into a brief an AI coding agent can execute without drifting.
  Applies four framing questions — what is being created, for whom, what are the limitations,
  how will it be proven complete and correct — then interrogates the ask for the unstated
  rules (expiry, reuse, rate limits, concurrency, failure paths) that decide whether the
  generated code is right or merely plausible. Trigger when: a request is a single sentence
  but the work is not ("build a password reset", "add login", "make an upload feature"),
  the user asks how to prompt or brief an agent, a previous agent run produced working code
  that solved the wrong problem, you are about to start coding from an ask with no stated
  edge cases, or someone asks what questions to ask before building. Thai triggers:
  "ถามอะไรก่อนเริ่มเขียนโค้ด", "เขียน brief ให้ AI", "สั่งงาน AI ยังไงให้ตรง", "ขอบเขตงานไม่ชัด".
  Not for extracting requirements from code that already exists (use requirement-gathering)
  and not for gating a multi-session build (use long-horizon-engineering-workflow) — this
  is the step before either: writing the ask down properly in the first place.
license: MIT
metadata:
  author: tp-job (enhanced by Claude)
  version: "1.1.0"
  source: Agentic Engineering briefing method (compiled 2026)
---

# Agentic Engineering

## Why this exists

An agent will build almost anything you describe. It will not tell you that your description had four unanswered questions in it — it will answer them itself, silently, in whichever way the training data leaned, and hand you code that runs.

That is the actual failure mode of agent-assisted development. Not broken code: **plausible code built against invented requirements.** "Build a password reset" gets you a token. Whether that token expires in an hour or never, whether it can be used twice, whether an attacker can request ten thousand of them — the agent picked. You will find out in production.

The fix is not longer prompts. It is a short, specific brief, produced by asking the four questions below and then interrogating the answers for the rules nobody stated.

---

## The four questions

Ask these before writing any code. If an answer is missing, get it or state the assumption in writing — never leave it implicit.

| # | Question | What a bad answer looks like | What a usable answer looks like |
| --- | --- | --- | --- |
| 1 | **What is being created?** | "A password reset system." | "An email-link flow that lets a user set a new password without knowing the old one." |
| 2 | **For whom?** | "Users." | "Signed-up end users who lost access; not admins, who use a separate impersonation path." |
| 3 | **What are the limitations?** | "Keep it secure." | "Token valid 30 min, single use, max 3 requests per email per hour, no user enumeration in responses." |
| 4 | **How will it be proven complete and correct?** | "It works." | "Six named tests, listed in the brief, including expired-token and reused-token cases." |

Q1 and Q2 stop you building the wrong thing. Q3 and Q4 stop you shipping the right thing broken. Skipping Q3 is the most common and most expensive omission — depth on it lives in [interrogation](references/interrogation.md).

---

## Workflow

```
1  FRAME       Answer Q1–Q4 from the request as given.
2  INTERROGATE Attack each answer for unstated rules. Do not stop at the first gap.
3  BRIEF       Write it down — scope, rules, out-of-scope, proof. One page.
4  CONFIRM     Show the brief. Ambiguity resolved by the user costs a sentence;
               resolved by the agent costs a rebuild.
5  BUILD       Execute against the brief. The brief, not the chat, is the source of truth.
```

Step 2 is where the value is. The framing questions are easy to answer badly — plausibly, fluently, and without content. Interrogation is what turns "keep it secure" into a list of rules a test can check.

**Rule for step 4:** ask about what is genuinely undecidable, not about what a careful engineer would just pick. "Should the token be single-use?" — decide it yourself, single-use, and say so. "Should reset invalidate the user's other sessions?" — that is a product call with a real trade-off; ask.

---

## Where to look

| Your question right now | Read |
| --- | --- |
| How do I answer the four questions well? | [four-questions](references/four-questions.md) |
| What am I not asking? Give me the question bank. | [interrogation](references/interrogation.md) |
| What does the finished brief look like? | [brief-template](references/brief-template.md) |
| Show me one end to end. | [worked-example](references/worked-example.md) |
| What counts as "proven complete and correct"? | [proof-of-done](references/proof-of-done.md) |

---

## The signal that you skipped this

You are mid-build and hit a question the brief cannot answer — "wait, what happens if they click the link twice?" Every one of those is a requirement discovered at implementation time, at implementation cost. One or two is normal. A steady stream means the brief was decoration; stop and rewrite it rather than resolving them one at a time in code.

Equally: an agent that never asks anything about a genuinely ambiguous ask is not being efficient. It is guessing quietly.

---

## When not to use this

- **The ask is fully specified already** — a named bug with a repro, a typo, a version bump. Briefing it is ceremony.
- **Exploration and spikes.** When the goal is to learn what is possible, a fixed brief works against you. Set a time or scope limit instead, and brief the real build afterward.
- **The work already has a written spec.** Check the spec against the four questions, fill gaps, move on — do not rewrite it in this format.
- **Multi-session builds** need more than a brief: they need on-disk state and gates. Brief the feature here, then hand the brief to whatever runs your gated build loop.
- **The requirements live in existing code** rather than in someone's head — that is extraction, not briefing. A codebase scanner that documents what already exists is a different tool from this one.

---

## One-paragraph version

Before building, write down what is being created, for whom, under what limits, and how you will know it is right. Then attack the limits section until it contains numbers and named failure cases instead of adjectives. Confirm it. Build against it. The cost of this is about ten minutes; the cost of not doing it is a rebuild you will mistake for a bug fix.

These are copies, not forks. Refresh them from the skill library rather than editing them in place; the only thing that differs from the originals is the depth of their relative links.
