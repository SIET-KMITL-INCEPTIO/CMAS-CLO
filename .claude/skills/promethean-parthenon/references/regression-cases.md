# Regression cases — the failures this skill has actually caused

Every case below is a real failure from a real build, not an invented scenario. Each one has a
known correct answer, which is what makes the set usable: you can tell a fix from a coincidence.

**How to run them:** [skill-creator](../bundled/skill-creator/SKILL.md) §Running and evaluating
test cases. Baseline first, change one rule, re-run. `unclear` is a result and must not be
rounded up to `pass`.

**How to add to them:** when this skill produces something wrong, write the case *before*
writing the fix. A case written afterwards gets shaped to fit the fix and stops being evidence.

---

## RC-01 · Harness written to an ignored path

| | |
| --- | --- |
| **Prompt** | "Set up the harness for this build." |
| **Context** | A repo whose `.gitignore` contains a bare `build/` line — which matches at *any* depth, not just the root. |
| **Observed failure** | Harness created at `.agents/build/`. Every file silently untracked. Invariants 7, 8 and 9 all reason from "they're tracked, so…", and none of that holds. A cold session bootstraps and finds nothing. |
| **Expected after fix** | The bootstrap runs `git check-ignore -v` against the harness path *before* writing, and stops if the path is ignored. |
| **Owner** | [harness-state](../bundled/long-horizon-engineering-workflow/references/harness-state.md) |

## RC-02 · Schema change proposed against a repo that cannot take it

| | |
| --- | --- |
| **Prompt** | "Add a table for X." |
| **Context** | A Prisma repo with **no** `migrations/` directory — every schema change to date applied with `db push`. |
| **Observed failure** | The build spec instructed `prisma migrate dev`. On a populated database that command reads the state as drifted and offers to **reset** it. Caught only by listing the directory first, by luck. |
| **Expected after fix** | Stage 2 asks how *this* repo applies schema changes and answers from evidence in the tree, before any spec names a command. |
| **Owner** | [long-horizon SKILL.md](../bundled/long-horizon-engineering-workflow/SKILL.md) §Stage 2 |

## RC-03 · A feature that cannot be verified here gets marked passing

| | |
| --- | --- |
| **Prompt** | "Verify the panel respects `prefers-reduced-motion`." |
| **Context** | A headless browser that cannot emulate the media query, fire `resize`, or grant clipboard access. |
| **Observed failure** | Marked `passes: true` with a GAP note in prose — precisely the fudge invariant 2 exists to prevent. The ledger had a boolean where reality had three states. |
| **Expected after fix** | `passes: "blocked"` with `blocked_reason` and `recheck_when`, and Stage 4 reads its gap list from that field rather than from prose. |
| **Owner** | [feature-list template](../bundled/long-horizon-engineering-workflow/assets/feature-list.template.json) |

## RC-04 · A bulk-write script that corrupts data on the second run

| | |
| --- | --- |
| **Prompt** | "Write a script to repair the bad timestamps." |
| **Context** | Rows wrong by a fixed offset; the detection rule is relative to current values. |
| **Observed failure** | After a successful repair, 40 rows still matched the detection rule. A second run would have subtracted the offset again. Found *after* the script had already run once. |
| **Expected after fix** | Any script that writes in bulk carries a verification step proving that running it twice leaves the same state as running it once — observed, not argued. |
| **Owner** | [feature-loop](../bundled/long-horizon-engineering-workflow/references/feature-loop.md) §Verify |

## RC-05 · A spec that states an unmeasured claim as fact

| | |
| --- | --- |
| **Prompt** | "Write the requirements doc from this codebase." |
| **Context** | A timestamp bug whose blast radius had been reasoned about but not measured. |
| **Observed failure** | The doc warned the bug threatened scheduling and calendar days. Measurement later showed the affected field was never touched — calendar days had always been correct. The alarm shipped several times louder than the fact. |
| **Expected after fix** | A behavioural claim in a document is either measured, or marked as inferred. The two are visibly different in the output. |
| **Owner** | [safety-and-invariants](../bundled/long-horizon-engineering-workflow/references/safety-and-invariants.md) invariant 2 |

## RC-06 · Bundled skills that never fire

| | |
| --- | --- |
| **Prompt** | "Add encryption for user-supplied API keys" · "check the theme and contrast on this page" |
| **Context** | The bundle ships `owasp-top-10-2025` (with `cryptographic-failures.md`, `broken-access-control.md`) and `ui-checker` (with a WCAG checker and theme patterns). |
| **Observed failure** | Neither was opened. Envelope encryption, a rate-limit bypass and cross-user isolation were all built without the bundled security reference; contrast and dark mode were checked by hand. Both skills were reachable only from one table row in `routing.md`, and the router's own `SKILL.md` — the file that is actually loaded — never named them. |
| **Expected after fix** | The router's `SKILL.md` names every bundled skill with the trigger that should reach it. |
| **Owner** | [SKILL.md](../SKILL.md) |

## RC-07 · A decision that was right, and expired

| | |
| --- | --- |
| **Prompt** | "Add a master list showing every open task across days." |
| **Context** | Todos deliberately stored as JSON inside a note. The original comment gave sound reasons — one row, one write, one answer per day. |
| **Observed failure** | No step existed for "the decision is still correct, but its premise changed." Invariant 1 covers a *wrong* target; nothing covered a right one whose grounds had expired. The framing had to be invented mid-build. |
| **Expected after fix** | Design records carry the premise they rest on, and a gate re-checks which premises still hold. |
| **Owner** | [design-and-architecture](../bundled/long-horizon-engineering-workflow/references/design-and-architecture.md) |

## RC-08 · One commit, four unrelated concerns

| | |
| --- | --- |
| **Prompt** | *(any loop iteration ending in a commit)* |
| **Context** | A session that had produced a layout redesign, a security fix, a data-layer fix and a spec-driven rename. |
| **Observed failure** | All eight files landed in one commit titled `fix(prisma): pin session timezone to UTC`. Three of the four concerns are unfindable from history. The Format pillar defines commit conventions and the loop's commit step never pointed at them. |
| **Expected after fix** | The loop's commit step names the convention, and one commit carries one reason to revert. |
| **Owner** | [feature-loop](../bundled/long-horizon-engineering-workflow/references/feature-loop.md) §Commit |
