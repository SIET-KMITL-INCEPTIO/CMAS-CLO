# Proof of Done

Q4 of the four questions: *how will the work be proven complete and correct?* Answered before the build, it is a specification. Answered after, it is a description of whatever happened to get built — which is why the ordering is not a stylistic preference.

---

## Complete and correct are different claims

- **Complete** — every behavior in the brief's scope exists. Checked against **What / Who / Out of scope**.
- **Correct** — every rule holds and no prohibition is violated. Checked against **Rules / Must never**.

Unbriefed agent output is characteristically complete and incorrect: every screen present, every unstated rule invented. Completeness is visible in a demo; correctness is not. That asymmetry is why the proof list must be written down rather than eyeballed.

---

## Building the proof list

Mechanical, from the brief:

1. One line per rule. `R5 → P6`.
2. One line per prohibition. These are the sharpest checks you have — a prohibition is already phrased as a thing that must fail.
3. One happy path. Exactly one; it is the least informative check in the set.
4. One line per assumption that would be expensive if wrong.

If the proof list is shorter than the rules list, rules are going unchecked. Say which ones and why, rather than letting the gap sit silently.

---

## What counts as proof

Ranked by strength. Use the strongest one the check permits — but a weaker check that actually runs beats a stronger one you describe and skip.

| Proof | Use for | Strength |
| --- | --- | --- |
| Automated test | Anything with a deterministic input and output. Default choice. | Strongest — it survives the next change |
| Executed script or query | Data-shape claims, migrations, log scans, "no raw token appears anywhere" | Strong, but one-shot |
| Manual run with recorded output | UI flows, third-party interactions, timing bands | Real, but does not survive |
| Code reading | Structural claims — "the permission check runs before the fetch" | Weak; states presence, not behavior |
| "It looks right" | Nothing | Not proof |

**A test that has never failed has proven nothing.** For each prohibition, confirm the check fails when the prohibition is violated — break it deliberately once, or write it against the pre-fix code. A test asserting `expect(rejected).toBe(true)` against an endpoint that rejects everything, including valid input, is green and worthless.

---

## Reporting

State the result honestly and specifically. Three permitted verdicts per proof line:

- **Passed** — ran, and it checked the thing it claims to check.
- **Failed** — with the actual output, not a summary of it.
- **Not run** — with the reason. This is a legitimate outcome; hiding it is not.

**BAD** — "All tests pass, the feature is complete and secure."
**BETTER** — "P1–P6, P8, P10 pass. P7 (enumeration timing) partly verified: response bodies are identical, timing measured locally only — not proven under production load. P9 (log scan) not run; needs a staging run with real mail sending."

The second version is worth more, because a reader can act on it. Declaring victory over unverified work is the characteristic failure of an unsupervised agent, and it is a reporting failure before it is an engineering one.

---

## Signals the proof was theater

- Every check passed on the first run. Possible, but interrogate it — usually it means the checks assert what the code does rather than what the brief requires.
- No proof line maps to a **Must never** item.
- The proof list was written after the code, in the same session, by the same agent.
- Checks that assert the presence of a function rather than the behavior of a call.
- A rule with a number in it (`30 minutes`, `3 per hour`) whose check never tests the boundary — only a value comfortably inside it.

---

## Closing the loop

When every proof line has a verdict, restate the brief's **What** sentence and ask whether the thing built actually delivers it. This catches the case that no rule-level check can: a feature that satisfies all ten rules and does not solve the problem — the failure mode Q1 and Q2 exist to prevent, showing up at the last possible moment. It is a cheap final question, and occasionally it saves the release.
