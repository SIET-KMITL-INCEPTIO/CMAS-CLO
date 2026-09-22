# The Brief

One page. It is the contract between the ask and the code — during the build, the brief is the source of truth, not the chat scrollback.

---

## Template

```markdown
# Brief: <capability, in verb form>

## What
<One sentence. What a person can do after this ships. No implementation nouns.>

## Who
For: <the actor, specifically>
Not for: <the adjacent actor this excludes>
Scale: <rough number of actors / events>

## Rules
R1. <rule with a number or a boundary>
R2. ...
    <every rule is checkable; no adjectives>

## Must never
N1. <forbidden outcome, stated as a prohibition>
N2. ...

## Out of scope
- <the thing a reader would assume is included and is not>

## Assumptions
A1. <decided without asking, because a careful engineer would pick this>

## Open questions
Q1. <genuinely undecidable — needs the user before build starts>

## Proof
P1. <named check, one per rule and per prohibition>
P2. ...

## Environment
<stack, versions, existing code this must fit into, flags/secrets needed>
```

---

## Rules for writing it

- **Number everything.** R1, N2, P3 are how the build refers back. "As discussed" is not a reference.
- **Rules and prohibitions are separate lists.** A prohibition is the sharpest kind of test and the easiest to lose inside a paragraph of rules.
- **Every rule has a proof line.** A rule nothing checks is a wish. If P is shorter than R, you are not done.
- **Assumptions are written, not implied.** The whole point is that a silent decision becomes a visible one. An assumption the user reads and ignores is fine; one they never saw is a bug with your name on it.
- **Open questions block the build only if the answer changes structure.** Otherwise assume, record, and keep going — flag it and move on rather than stalling on a detail.
- **Out of scope is not optional.** Under-specified scope is the single most common defect in a brief, and the cheapest to fix.

---

## Length

One page. If it runs to three, you are briefing three features — split it, and brief them separately. If it runs to five lines, either the work is genuinely trivial (fine — skip the brief entirely) or the interrogation never happened.

---

## What it is not

- **Not a design doc.** The brief says what must be true, not how it is built. Table shapes, module layout, and library choices come after and may change without touching the brief.
- **Not a ticket.** No estimates, no assignee, no status.
- **Not immutable.** When a real constraint surfaces mid-build, amend the brief and say so. What is forbidden is discovering the constraint, silently coding around it, and leaving the brief describing something that no longer exists.

---

## Using it during the build

- Implement rule by rule. When something is ambiguous, the brief answers or the brief gets amended — do not resolve it in code and move on.
- When the context window is compacted or the session restarts, the brief is what you re-read. It is the reason the work survives losing the conversation.
- At the end, walk P1..Pn out loud against what exists. That walk, not a feeling of doneness, is the completion signal — see [proof-of-done](proof-of-done.md).

A filled-in example is in [worked-example](worked-example.md).
