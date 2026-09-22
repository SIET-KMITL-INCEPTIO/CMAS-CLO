# Engineering Workflow & Core Skills Framework

**Perspective: CEO · CTO · CIO · CPO · VP Engineering · Engineering Director · Technology Leadership**

---

## Executive Summary

This document defines the end-to-end software delivery workflow and the five non-negotiable skills every engineer and team lead must demonstrate. It is a direct response to recurring delivery failures: late UATs, production errors, and costly debug loops caused by poor requirements intake, absent design artefacts, and unclear feedback cycles.

---

## The Root Cause: Where Delivery Breaks Down

|Stage|Observed Problem|Business Impact|
|---|---|---|
|Requirements|Vague, incomplete, or assumed|Dev builds the wrong thing|
|Design|Dev self-interprets; no wireframe or logic map|Rework costs 3–5× the original estimate|
|Use Cases|Missing; UAT written too late|Bugs reach production|
|UAT|Conducted late, after full build|Expensive change at the wrong stage|
|Feedback|Not structured, not detailed|Debug loops consume sprint capacity|
|Version Control|No branching discipline|Fix-on-fix, regression risk|

**Leadership position:** These are process and skill failures, not individual failures. We fix the system.

---

## The Delivery Workflow: Gate-by-Gate

### Stage 1 — Requirements Intake

**Owner:** Product Manager + Tech Lead **Gate-keeper:** Engineering Director

Every feature or change request must pass a **Requirements Clarity Checklist** before any development begins.

**Required artefacts before Stage 2:**

- [ ] Problem statement written in plain language (1–3 sentences)
- [ ] Acceptance criteria listed (numbered, testable)
- [ ] Out-of-scope explicitly stated
- [ ] Dependencies and integrations identified
- [ ] Data inputs and expected outputs defined
- [ ] Edge cases and error states documented

> **CTO Directive:** If requirements cannot be written clearly, the feature is not ready to be built. No exceptions.

---

### Stage 2 — Design & Architecture

**Owner:** Tech Lead + Senior Engineer (+ Designer for UI features) **Gate-keeper:** VP Engineering

Design is not optional. Design is how we think before we code.

**Required artefacts before Stage 3:**

- [ ] **Wireframe or UI mockup** — for any user-facing change, even minor ones
- [ ] **Logic flow diagram** — sequence diagram or flowchart showing system behaviour
- [ ] **Use Case document** — who does what, when, and what the system responds with
- [ ] **Data model or API contract** — agreed schema or endpoint spec, not assumed
- [ ] **Error and fallback behaviour** — defined, not left to the developer's judgment
- [ ] Tech Lead sign-off recorded

> **CPO Directive:** The designer and developer must review the wireframe together before a single line of code is written. The wireframe is the contract.

> **VP Engineering Directive:** Architecture decisions must be documented. "We figured it out in Slack" is not documentation.

---

### Stage 3 — Development

**Owner:** Engineer **Gate-keeper:** Tech Lead (via code review)

Development works within the agreed design. Deviations must be flagged and re-approved — not silently shipped.

**Engineering standards:**

- [ ] Feature branch from `main` or `develop` — no direct commits to shared branches
- [ ] Commit messages are descriptive: `feat: add validation for empty email on registration`
- [ ] Unit tests written alongside code, not after
- [ ] Self-review checklist completed before raising a PR
- [ ] PR description references the requirement ticket and links to the use case

> **Engineering Director Directive:** Version control discipline is not a suggestion. A debug loop caused by branching chaos is a self-inflicted wound. It will be treated as a process non-compliance, not a technical problem.

---

### Stage 4 — Internal Review & QA

**Owner:** QA Engineer + Tech Lead **Gate-keeper:** Tech Lead

Testing must happen against the use cases written in Stage 2. If the use case was not written, testing is guesswork.

**Required before Stage 5:**

- [ ] All use cases tested and results recorded
- [ ] Edge cases and error states verified
- [ ] Regression check on affected areas
- [ ] No critical or high-severity bugs open
- [ ] QA sign-off documented

---

### Stage 5 — User Acceptance Testing (UAT)

**Owner:** Product Manager + Business Stakeholder **Gate-keeper:** CPO

UAT is not the first time the user sees the product. If UAT is the first time the user sees the product, we have already failed.

**UAT rules:**

- [ ] UAT script prepared from Stage 2 use cases — not written at this stage
- [ ] UAT environment matches production configuration
- [ ] Tester is a real user or domain expert — not the developer who built it
- [ ] Feedback must be written using the Structured Feedback Format (see below)
- [ ] UAT sign-off document completed and stored before deployment

> **CEO Directive:** Production errors caused by skipped or rushed UAT are a leadership failure, not a developer failure. We will not ship without a signed UAT. Revenue lost to downtime costs more than time spent testing.

---

### Stage 6 — Deployment & Monitoring

**Owner:** DevOps / Platform Engineer **Gate-keeper:** Engineering Director

- [ ] Deployment plan reviewed and approved
- [ ] Rollback plan documented
- [ ] Monitoring alerts confirmed active
- [ ] Post-deployment smoke test completed
- [ ] Incident response owner identified for the release window

---

## Structured Feedback Format

Unstructured feedback — "it's broken," "doesn't work," "wrong" — is not actionable. It wastes engineering time and creates adversarial dynamics.

**Every bug report or feedback item must follow this format:**

```
TITLE:         [Short, specific description]
ENVIRONMENT:   [Browser / OS / Device / URL / Stage or Production]
USER ROLE:     [Who was performing the action]
STEPS TO REPRODUCE:
  1. ...
  2. ...
  3. ...
EXPECTED RESULT:  [What should happen, based on use case or acceptance criteria]
ACTUAL RESULT:    [What actually happened]
SCREENSHOT/LOG:   [Attached]
SEVERITY:         [Critical / High / Medium / Low]
TICKET REFERENCE: [Link to original requirement]
```

> **CIO Directive:** Feedback that does not follow this format will be returned to the sender. This is not bureaucracy — it is the minimum information needed to fix something without wasting time.

---

## The Five Core Skills Every Engineer Must Develop

### Skill 1 — Elicit Clean Requirements

The ability to ask questions until the requirement is unambiguous.

**What this looks like in practice:**

- Ask "what does success look like?" before asking "how should I build it?"
- Challenge vague words: "fast," "simple," "better" — what do they mean in measurable terms?
- Produce a written summary of the requirement and get it confirmed before starting work
- Identify what is explicitly out of scope

**Failure mode:** Starting development based on a verbal conversation with no written confirmation.

---

### Skill 2 — Sound Basic Logic and System Thinking

The ability to reason through how a system behaves before writing code.

**What this looks like in practice:**

- Map the happy path, then identify every branch: what if the input is empty? what if the API fails?
- Use a flowchart or sequence diagram — even a rough one — to catch logic gaps early
- Ask: "what does the system do when this goes wrong?" for every step
- Validate logic with a peer before committing to an implementation

**Failure mode:** Writing code to satisfy the happy path, and discovering edge cases in production.

---

### Skill 3 — Define and Validate the Output

The ability to specify what "done" looks like before work begins, and verify it at the end.

**What this looks like in practice:**

- Write the expected output — the data, the UI state, the API response — before writing the function
- Use that definition as the test case
- Review the actual output against the expected output before raising a PR
- Involve a second person (QA or peer) to verify independently

**Failure mode:** Delivering a feature that works for the developer but not for the user, because "working" was never defined.

---

### Skill 4 — Communicate With Stakeholders Clearly

The ability to translate technical reality into language the business understands, and to surface blockers before they become incidents.

**What this looks like in practice:**

- Give status updates in terms of outcomes, not activities: "the login flow is complete and tested" not "I'm working on the auth module"
- Escalate blockers the same day they are identified — not at the end of the sprint
- When a requirement is unclear, ask in writing and document the answer
- Give and receive structured feedback using the format above
- Never say "done" when you mean "done on my machine"

**Failure mode:** Silent progress updates, surprises at demo day, and feedback loops that run for weeks.

---

### Skill 5 — Write Documentation and Complete UAT Sign-Off

The ability to produce written artefacts that allow any team member to understand, test, and maintain the work.

**What this looks like in practice:**

- Write a brief README or change note for every feature: what it does, how to configure it, known limitations
- Maintain the use case document through development — update it when scope changes
- Prepare the UAT script from the use cases — not from memory
- Obtain written sign-off from the business stakeholder before deployment
- Store all artefacts in a shared, accessible location — not in a personal folder or chat history

**Failure mode:** The only person who understands the system is the developer who built it, and they have left the company.

---

## Leadership Accountability Matrix

|Area|Accountable|Responsible|Consulted|Informed|
|---|---|---|---|---|
|Requirements quality|CPO|Product Manager|Tech Lead|Engineering Director|
|Design artefacts|VP Engineering|Tech Lead|Designer|Developer|
|Use case coverage|Engineering Director|QA Engineer|Tech Lead|CPO|
|UAT readiness|CPO|Product Manager|QA|CEO|
|Code quality & branching|VP Engineering|Tech Lead|Senior Engineer|Engineering Director|
|Feedback quality|Engineering Director|Tech Lead|PM|All|
|Documentation|VP Engineering|Engineer|Tech Lead|CIO|

---

## Metrics That Will Be Tracked

|Metric|Target|Review Cadence|
|---|---|---|
|Requirements signed off before dev starts|100%|Per sprint|
|Wireframe / use case present at code review|100%|Per PR|
|UAT completed before production deploy|100%|Per release|
|Production incidents caused by skipped process|0|Monthly|
|Feedback items returned for missing detail|Trend to zero|Monthly|
|Average time in debug loop per sprint|Reduce 50% in Q1|Monthly|

---

## Summary: What Changes Starting Now

1. **No development starts without a written, confirmed requirement.**
2. **No code is reviewed without a wireframe or logic diagram attached.**
3. **UAT scripts are written at design time, not testing time.**
4. **Feedback must follow the structured format — vague reports will be returned.**
5. **Version control branching is enforced — direct commits to shared branches are blocked.**
6. **All five core skills are assessed in quarterly engineering reviews.**

> These standards exist to protect the team from waste, not to create overhead. Every hour spent on clarity at the front saves three hours of debugging at the back.

---

_Document Owner: Technology Leadership_ _Review Cycle: Quarterly_ _Next Review: Q3 2026_