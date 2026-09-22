# Routing

Which pillar carries this work. Read the first table that matches your situation and stop.

Task carries three skills, so a Task verdict always names which one: **extract** (requirement-gathering), **brief** (agentic-engineering), or **build** (long-horizon-engineering-workflow).

---

## By what you are holding right now

| You have | Pillar | Then |
| --- | --- | --- |
| A one-line ask with real work behind it | **Task — brief** | → build if multi-session |
| An existing codebase and no written spec | **Task — extract** | → brief the delta, then build |
| A written target, build spans sessions | **Task — build** | → Format at the end |
| A written target, one small change | *None* — just build it | Verify against the target's proof lines |
| Two viable approaches and a preference for neither | **Role** | → Task to brief the winner |
| Finished work that needs writing up | **Format** | — |
| A spec someone else wrote | **Task — brief**, in check mode | Test it against the four questions, fill gaps, do not rewrite |
| A vague complaint that something is broken | **Task — build**, structured feedback | → debug-master once there is a repro |
| A component nobody can safely change | **Task — extract** | The contract has to exist before the change does |
| A written target too big to land in one branch | **Task — build**, phase plan first | Cut phases before features; one phase, one branch |

---

## By what went wrong

| Symptom | Pillar | The actual defect |
| --- | --- | --- |
| Output runs, solves the wrong problem | **Task — brief** | Q1/Q2 never answered — the code is fine, the target was wrong |
| Rules appeared you never agreed to | **Task — brief** | Q3 answered with adjectives; the agent filled the gaps |
| New code breaks callers nobody knew about | **Task — extract** | The published contract was never written down, so it could not be respected |
| "Done" that isn't | **Task — brief** → build | No proof list before the build, so nothing to check against |
| Session two contradicts session one | **Task — build** | No on-disk state; the transcript was the state |
| Same bug fixed three times | **Task — build** | Re-run decomposition — a recurring bug is a design flaw in disguise |
| Fourth copy of an existing utility | **Task — build** | Pattern recognition skipped at Stage 2, or the loop's refactor step skipped |
| Code works but the module degrades every iteration | **Task — build** | The refactor box is being treated as optional |
| Integrations fail on field names and types | **Task — build** | Data mapping skipped at Stage 2 |
| Confident answer, no trade-offs named | **Role** | You got a summary where you needed a position |
| Thorough answer to a question nobody asked | **Role** | Wrong seat, competently occupied — re-detect the discipline |
| Scope keeps growing | **Role** | Decide: is this discovery, or is the acceptance criterion drifting? |
| "What did we ship?" is unanswerable | **Format** | No conventions in the history; fix forward |

---

## Sizing: how much pillar for how much work

The pillars scale. Applying all three at full weight to a small change is the failure mode of this skill.

| Work size | Role | Task | Format |
| --- | --- | --- | --- |
| One-line fix, known cause | — | One sentence of target | Commit message |
| Small feature, one session | — | Half-page brief, gates, no harness | Commit + PR body |
| Multi-component, one session | At the design gate | Full brief, gates + ledger | PR body |
| Change to an existing system | At the design gate | Extract first, then brief the delta, then build | PR body + contract diff |
| Multi-session build | Gates, 2× failures, irreversibles | Full brief, gates + full harness, phases | Full report, grouped by phase |
| Irreversible or public-facing | Mandatory, before commit | Full, plus security features on the ledger | Full report |

**Rule of thumb:** skip the harness under ~10 sub-tasks and one session — below that, the gates carry it alone. Never skip writing the target down; size it down instead.

**Phases scale the same way.** Under ~10 features, one branch and the feature loop is the whole answer; phases over a small build are ceremony. Past that, cut phases — one branch each — and the report's grouping comes out of the build instead of being imposed on it afterwards.

---

## Tie-breakers

**Extract vs. brief.** Where do the requirements live *right now*? In code → extract. In someone's head → brief. In both → extract first: a brief written in ignorance of the existing contracts produces work that has to be redone the moment it meets them.

**Brief vs. build.** Is the *target* unclear, or the *path*? Unclear target is always brief first — running gates against a wrong target produces a well-verified wrong thing.

**Build vs. Role.** Build asks "is this built correctly?" Role asks "should this be built?" If you cannot tell, ask what a wrong answer costs: recoverable → build, expensive or irreversible → Role.

**Brief vs. Role.** A brief *writes down* a decision. Role *makes* one. If the brief has an **Open questions** section with a real trade-off in it, that item belongs to Role; everything else in the brief belongs to Task.

**Format vs. nothing.** If the work took more than a day or crossed a team boundary, it needs a record. Below that, the commit history is the record.

---

## Handing off to skills outside the Parthenon

These pillars cover *constructing software with an agent*. Requests that touch adjacent concerns route out:

| Request | Skill |
| --- | --- |
| A specific bug with a stack trace or repro | [debug-master](../bundled/debug-master/SKILL.md) |
| Security review of written code | [owasp-top-10-2025](../bundled/owasp-top-10-2025/SKILL.md) |
| UI quality, theme, accessibility audit | [ui-checker](../bundled/ui-checker/SKILL.md) |
| Where does this file go, what is it called | [project-file-structure](../bundled/project-file-structure/SKILL.md) |
| Writing or improving a skill itself | [skill-creator](../bundled/skill-creator/SKILL.md) |

Route out early. A pillar applied to work it was not built for produces confident output about the wrong dimension — which is the exact failure this skill exists to prevent.

---

## The default

**When routing is genuinely unclear, start at the front of Task** — extract if there is a codebase, brief if there is not. It costs minutes, it produces the artifact every other pillar consumes, and its absence is the single most common cause of bad agent output. If after writing the target down the answer is "this is a one-liner", you have lost ten minutes. If you skip it and the target was wrong, you lose the build.
