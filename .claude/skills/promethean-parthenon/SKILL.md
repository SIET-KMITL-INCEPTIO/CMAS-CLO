---
name: promethean-parthenon
description: >-
  The operating doctrine for getting high-performance output out of an AI coding agent,
  and the router across the skills that produce it, organised as Role · Task · Format:
  set the seat that answers (senior-leadership-advisor), fix the target and build against it
  — extract requirements from code that already exists (requirement-gathering), brief a new
  ask (agentic-engineering), construct it under gates and on-disk state
  (long-horizon-engineering-workflow) — then land the result in a shape that survives
  (github-report). Trigger when: starting any non-trivial piece of work with an agent and
  unsure where to begin, an agent produced code that runs but is wrong or off-target, output
  quality is degrading over a long session, you are about to say "just build it" on something
  substantial, or you ask "how do I get better results from Claude / the agent", "which skill
  should I use for this", "why does the agent keep drifting", "how do I set up role task
  format". Thai triggers: "ใช้ AI agent ยังไงให้ได้งานดี", "agent ทำงานหลุดประเด็น",
  "ควรใช้ skill ไหน", "งานที่ได้ไม่ตรงที่สั่ง". Not itself a builder or a reviewer — it decides
  which pillar carries the work and hands off; go straight to a pillar when you already know
  which one.
license: MIT
metadata:
  author: tp-job (enhanced by Claude)
  version: "2.4.0"
  source: >-
    Promethean Parthenon doctrine — Role · Task · Format synthesis of the
    senior-leadership-advisor, requirement-gathering, agentic-engineering,
    long-horizon-engineering-workflow, and github-report skills (compiled 2026)
---

# Promethean Parthenon

**Promethean** — foresight. The thinking happens before the fire, not after the building burns.
**Parthenon** — pillars carrying one roof. Remove any pillar and the load does not redistribute; the roof comes down.

## The problem this solves

An AI agent's output quality is not mostly a function of the model. It is a function of three things you control, and every one of them fails silently.

- **No role** → you get **the average answer**. Both options summarised fairly, no position taken, trade-offs unnamed.
- **No task** → you get **plausible code built against invented requirements**. It runs. It is wrong. And on anything long, it then **drifts**: features declared done that were never verified, context lost between sessions, the ledger no longer matching reality.
- **No format** → you get **work that happened but cannot be shown**, and the same decision re-argued next month.

None of these announce themselves. All three produce output that *looks* like success. That is the whole reason this skill exists: the failures are silent, so the defenses have to be structural.

---

## The three pillars

**Role · Task · Format** is the shape of every instruction worth giving an agent. Name the three parts and each failure above gets an owner.

| Pillar | Answers | Skill | Fails as |
| --- | --- | --- | --- |
| **Role** | Who is answering, and to what standard? | [senior-leadership-advisor](bundled/senior-leadership-advisor/SKILL.md) | competent execution of a bad decision |
| **Task** | What is being done, against what target, proven how? | [requirement-gathering](bundled/requirement-gathering/SKILL.md) · [agentic-engineering](bundled/agentic-engineering/SKILL.md) · [long-horizon-engineering-workflow](bundled/long-horizon-engineering-workflow/SKILL.md) | invented rules, then silent drift |
| **Format** | What shape does the output take, and what survives? | [github-report](bundled/github-report/SKILL.md) | invisible work, re-argued decisions |

Depth on what each pillar holds and how it cracks: [pillars](references/pillars.md).

---

## Inside the Task pillar

Task is the widest pillar because it carries three skills and one rule about their order: **you cannot build against a target you have not written down.** Which skill writes it depends on where the requirements currently live.

| The requirements live in… | Skill | Produces |
| --- | --- | --- |
| Code that already exists | **requirement-gathering** | `REQ-*` items, component/API/DB contracts, and a gap list — extracted in one pass, no follow-up questions |
| Someone's head, one sentence long | **agentic-engineering** | a one-page brief — what, for whom, under what limits, proven how |
| A written target that now has to be built | **long-horizon-engineering-workflow** | gates, a ledger, verified commits, on-disk state |

The first two are **two doors into the same room.** Point at a repository → requirement-gathering. Point at an idea → agentic-engineering. Extending an existing system with something new → both, extraction first, because the brief for the new part has to respect the contracts the old part already publishes.

Then long-horizon carries construction. It consumes the written target at Stage 1 and does not re-derive it.

**Construction is planned in phases, and a phase is a branch.** Between "the build" and "one feature" sits a middle unit — a phase, or a sprint when the cut is by date rather than by scope — and the ratio to branches is **one to one**. Below that level branching is open, and the obligation is that each sub-branch names why it exists. The 1:1 is what makes a phase a unit rather than a label: it bounds what a revert costs, gives Stage 3 a close-out that has to be *true* rather than asserted, and makes the phase a range a report can be built from.

**Group by contract, not by topic.** What belongs in one phase is decided by one question — *does anything consume what this task produces?* A task that reads another's field, state shape, DOM node, token, route, or event is bound to it and cannot be split from it; tasks that each change an existing value with nothing reading their output are free to be grouped or not. "Both of these are colour" and "both are under this heading" are not coupling, and grouping on them is the most common way a phase plan goes wrong. Compressing phases to save merges is legitimate against that test and pays in rollback resolution — three phases on one branch is one revert handle where there were three, and it only helps if you already know which of the three to pull. Cuts, the compression test, sub-branch rationales, and the merge checklist: [long-horizon-engineering-workflow](bundled/long-horizon-engineering-workflow/references/phases-and-branches.md).

---

## The load path

Work moves through the pillars in order. Each hands the next a written artifact — that handoff *is* the structure.

```
   ┌───────────── the roof: output you can trust ─────────────┐
   │                                                          │
  ROLE ───────────────► TASK ────────────────────────► FORMAT
   the seat that        extract ─► brief ─► build       the record,
   answers, and to      (the target gets written        built from
   what standard         down before it is built)       real data

   seat ──────► target ──────► gates ──────► verified ──────► written
     │             │             │            commits          record
     │             │             └── is it actually done?
     │             └── what does "done" mean?
     └── who decides — and is this still the right thing to build?
```

**Role is not a stage — it is a pillar you step into and out of.** It carries load at the gates (is this the right design?), on any feature that has failed twice, and whenever the target and reality disagree. Everywhere else it is dead weight; a decision framework applied to a routine iteration is ceremony.

---

## Routing

Full decision table with tie-breakers: [routing](references/routing.md). The short version:

| What you have | Start at | Why not elsewhere |
| --- | --- | --- |
| One sentence, real work behind it | **Task** — agentic-engineering | Nothing downstream can be right if the target is wrong |
| An existing codebase and no written spec | **Task** — requirement-gathering | The requirements are already there; extracting beats inventing |
| A written target, multi-session build | **Task** — long-horizon | The target exists; now it needs gates and state |
| A written target, one small change | Just build it | Gates on a one-liner are ceremony |
| A choice between two approaches | **Role** | This is a decision, not a construction |
| Work is finished, needs writing up | **Format** | — |
| Agent output runs but is wrong | **Task** — agentic-engineering | The brief was the defect, not the code |
| Agent lost the thread mid-build | **Task** — long-horizon | Missing harness state, not missing skill |
| A specific bug with a repro | None of these | Use [debug-master](bundled/debug-master/SKILL.md) |

**Default when genuinely unsure: the front of Task.** Writing the target down is the cheapest move in the system and the most expensive to skip — ten minutes against a rebuild you will mistake for a bug fix.

---

## The specialists

Five more skills travel in this bundle. They are not pillars — they do not carry the load path — but each one owns a question the pillars will hit and answer worse on their own. **Open them by the trigger, mid-build, without leaving the pillar you are in.**

| Trigger — the moment it applies | Skill |
| --- | --- |
| You are about to write auth, crypto, access control, input handling, secrets, or anything an adversary touches — **before** writing it, not at review | [owasp-top-10-2025](bundled/owasp-top-10-2025/SKILL.md) |
| You changed anything visual: theme, contrast, dark mode, focus states, layout at a breakpoint | [ui-checker](bundled/ui-checker/SKILL.md) |
| You are creating a file or folder and choosing where it goes or what it is called | [project-file-structure](bundled/project-file-structure/SKILL.md) |
| You are writing or revising a skill — including these | [skill-creator](bundled/skill-creator/SKILL.md) |
| A specific bug with a reproduction | [debug-master](bundled/debug-master/SKILL.md) |

**These triggers fire inside the loop, not at a gate.** That placement is deliberate and was learned the expensive way: on a build that shipped envelope encryption, a rate-limit bypass fix and cross-user isolation checks, the security reference in this very bundle was never opened once, and the theme and contrast work was done by hand next to an unused WCAG checker. Nothing routed to them, so they may as well not have shipped. See [regression-cases](references/regression-cases.md) RC-06.

A specialist that changes nothing stays shut. But *"did I even consider it"* is a question you can only answer if the trigger is written where you are working — which is here, not three files away.

---

## The five levers

What actually moves agent output quality, ranked by effect. Detail and the measurements behind the ranking: [output-quality](references/output-quality.md).

1. **Specificity of the target.** The single largest lever, by a wide margin. A rule with a number in it beats a paragraph of adjectives. "Secure" is not a requirement; "an attacker with the email address cannot confirm the account exists" is.
2. **Verification you actually ran.** A test that has never failed has proven nothing. Implementation errors get caught by verification; verification errors get caught by nothing.
3. **State that outlives the conversation.** Anything living only in the transcript is not state. Compaction keeps the gist and drops the fact — and the fact is what you needed.
4. **Effort placed at decisions, not iterations.** Deep thinking at the gates, at decomposition, and on anything that failed twice. Routine loop iterations were decided upstream; thinking hard there is spend with no return. On current models this is a literal setting — a reasoning effort level from `low` to `max` — so reach for it before reaching for a different model.
5. **Scope held still.** A growing feature list is discovery working. A drifting acceptance criterion is the build going wrong. Know which one you are looking at.

---

## Diagnosing bad output

Symptom → cause → pillar. Expanded, with the tells for each: [failure-modes](references/failure-modes.md).

| What you are seeing | The actual cause | Go to |
| --- | --- | --- |
| Code runs, solves the wrong problem | Q1/Q2 were never answered | Task — agentic-engineering |
| Rules you never agreed to (expiry, limits, defaults) | Q3 was answered with adjectives | Task — agentic-engineering |
| New code contradicts contracts the system already publishes | Nobody read what was already there | Task — requirement-gathering |
| "Done" that isn't | No proof list written before the build | Task — write the target, then gate it |
| Session two contradicts session one | No on-disk state | Task — long-horizon |
| Same bug fixed three times | Decomposition was wrong, not the fix | Task — long-horizon, re-run decomposition |
| Fourth copy of an existing utility | Pattern recognition skipped, or the loop never refactored | Task — long-horizon, Stage 2 and the refactor step |
| Shape mismatch at every integration | Data mapping skipped | Task — long-horizon, Stage 2 |
| Confident answer, unnamed trade-offs | No role was set | Role |
| "What did we ship?" cannot be answered | No record, or no commit conventions | Format |

**The meta-tell:** an agent that never pushes back on an ambiguous ask is not being efficient. It is guessing quietly, and you will find out later.

---

## Operating rules

- **The target is never skipped, only sized.** A one-line ask for a one-line change needs one line of written target. It does not need zero.
- **Never claim a pass you did not observe.** "Implemented" ≠ "verified." This is the rule that everything else is built to protect.
- **One artifact per handoff.** A pillar handing off without its artifact is where the work leaks — and the next seat is usually a future session with no memory.
- **Occupy the role, don't narrate it.** "As the architect, I would say…" is not the Role pillar. The switch changes the work, not the wording.
- **Announce a skipped gate in one sentence, then comply.** Name the gate and the specific risk. If the user says go anyway, go — and do not re-raise it. A *new* risk later is fair; re-litigating the same one is not.
- **Stop after three failed attempts at the same thing.** Re-read the target and the design. A fourth attempt will not find what three missed.
- **The record is written from real data**, not from memory of what you think you did.

---

## When not to use this

- **You already know which pillar you need.** Go straight there. This skill is a router, and routing a decision you have already made is pure overhead.
- **Trivial, fully-specified work** — a typo, a version bump, a named bug with a repro. Three pillars over a one-line change is architecture as theater.
- **Exploration and spikes.** A fixed target works against you when the goal is to learn what is possible. Set a time or scope limit instead, then write the real target afterward.
- **Non-engineering requests.** These pillars are for constructing software. A pure research, writing, or analysis task has different failure modes.

---

## One-paragraph version

Set the seat before you set the work; write the target down before you build against it — extracting it from the codebase when it already exists, briefing it when it does not; build behind gates that write state to disk; and land the result in a record built from real data. The three failures this prevents — the average answer, invented requirements followed by silent drift, and invisible work — all produce output that looks like success, which is exactly why you need structure rather than attention.

---

## Bundled skills

This is the one skill in the library allowed to link to others — it is the aggregator, and every skill it links to travels with it as a verbatim copy under `bundled/`. Dropping this folder into a project brings the whole cluster with it and nothing dangles. The skills it points at are standalone components in their own right and carry no links or bundles of their own; only this file combines them.

These are copies, not forks. Refresh them from the skill library rather than editing them in place.

**When a bundled copy is actually broken, fix it and record the fix here.** "Never hand-edit `bundled/`" is the right default and a bad absolute: `skill-creator` shipped instructing eighteen scripts that do not exist in this bundle, which made the one skill responsible for repairing skills unable to run its own process. A rule that forbids repairing that leaves the break in place forever. Fix it, note it below, and carry the note into the next refresh so the upstream copy gets the same fix instead of silently reverting yours.

**A local fix is a debt, not a state.** It is paid off by carrying the same fix to the source skill and regenerating, which is the only way it survives the next refresh. Until it is paid, record it below; once it is, the row goes away because the copy is verbatim again.

**Local fixes outstanding:** none.

| Skill | Fix | Paid to upstream |
| --- | --- | --- |
| `skill-creator` | Replaced the automated eval half with a manual loop — it referenced 18 scripts and 3 agent files, none of which ship in this library at all | Yes — `skill-creator` v1.1.0 |
| `long-horizon-engineering-workflow` | Seven files carrying the RC-01…RC-08 fixes: the `git check-ignore` precheck, the ledger's third `blocked` state, decision premises and their expiry, Stage 2 house mechanics, prove-the-instrument-can-fail, idempotent bulk writes, one-concern commits | Yes — `long-horizon-engineering-workflow` v3.3.0 |

The second row is the case that proves the rule: those fixes lived only in `bundled/` for two months, so the skill every other project actually installs never received them, and `check-bundles.py` reported them as drift to be overwritten. A fix that exists only in a copy is one rebuild away from being deleted.

**One link did not survive the trip upstream.** The commit step's pointer to the reporting skill's commit conventions is legal here — the aggregator may link across skills — but illegal in the spoke, which must stand alone. It became plain prose in both. When propagating a bundled fix, expect any cross-skill link in it to need that conversion.

### Verifying this skill

Changes to any file in this package are checked against [regression-cases](references/regression-cases.md) — eight failures this skill has actually caused, each with a known correct answer. Add a case whenever it causes another, and write the case **before** the fix; a case written afterwards is shaped to fit the fix and stops being evidence.
