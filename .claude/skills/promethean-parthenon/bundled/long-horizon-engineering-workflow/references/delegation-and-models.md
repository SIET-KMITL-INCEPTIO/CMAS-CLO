# Delegation & Model Placement — where to spend effort

One principle governs this whole file:

> **Spend depth where a wrong answer is expensive to reverse. Spend throughput where it isn't.**

A wrong architecture costs the whole build. A wrong loop iteration costs one `git revert`. A **wrong verification costs everything downstream that trusted it** — which is why the cheapest-looking step in the loop is not the one to economize on.

Who occupies which seat is in [role-placement](./role-placement.md). This file is about how much to spend on each.

---

## The thinking pass

Seven points, run as one silent pass before committing to an answer:

1. **Think thoroughly** — every angle, not just the first plausible one
2. **Cover all bases** — operational reality after the happy path
3. **Consider all use cases** — everyone who touches this, not just the primary persona
4. **Think holistically** — does optimizing this piece break something at the system level?
5. **Edge cases** — empty states, zero values, concurrent writes, adversarial input
6. **First principles** — is this right because it's genuinely best, or just conventional?
7. **Pre-mortem** — if this fails in six months, what's the most believable reason?

This is the full method — nothing deeper to read elsewhere for it.

### Where to spend it

Running all seven every loop iteration is waste — most iterations are a well-specified sub-task whose decisions were made upstream.

| Where | Which points | Why there |
| --- | --- | --- |
| Stage 1–2, in full | All seven | These decisions get multiplied by every later iteration |
| Decomposition | Edge cases, all use cases | Verification steps are born here; a missed edge case here is **never tested** |
| Verification of a security or data-loss feature | Edge cases, pre-mortem | A false pass here is the expensive kind |
| Stage 6 | Pre-mortem, holistic | Irreversibility |
| Routine loop iteration | None by default | Decisions already made; throughput is the point |
| A feature that failed twice | Full pass, especially first principles | Two failures means the problem isn't effort — re-examine the requirement |

**Pre-mortem is the highest-yield point for long horizons specifically.** "If this build is a mess in six months, what's the most believable reason?" almost always names a process gap the harness can close *now* — an untested integration boundary, a spec drifting from the code, a feature nobody can verify.

---

## Effort placement — the dial to reach for first

**Reach for effort before you reach for a different model.** Current Claude models take a
`reasoning effort` setting — `low` · `medium` · `high` · `xhigh` · `max` — that moves thinking
depth and token spend on *one* model across a wider range than most model swaps do. One model at
two effort levels is simpler to reason about than two models, keeps a single set of behaviours in
play, and does not invalidate the prompt cache the way switching models does.

| Work | Effort | Because |
| --- | --- | --- |
| Stage 1–2, decomposition, Stage 6 rollback reasoning | `max` | One-shot decisions whose cost is multiplied by every later iteration |
| **Verification and the ledger write** | `high` or above | A false pass is the one error nothing downstream catches |
| Coding and agentic work generally | `xhigh` | The general-purpose setting for build work — sits between `high` and `max` |
| Routine loop iteration on a well-specified sub-task | `high`, dropping to `medium` | Decisions were made upstream; throughput is the point |
| Reading-heavy sub-agents (search, locate, summarize) | `low` | Fewer, more consolidated tool calls and less preamble is what you want here |

Lower effort buys terser output and fewer tool calls, not just a smaller bill — which is why a
routine iteration often *reads better* at `medium` than at `max`.

**Thinking itself is adaptive on current models** — the model decides when and how deep, and a
fixed thinking-token budget is a retired concept. If you are carrying a hard token ceiling
forward from an older setup, replace it with an effort level.

---

## Model placement

Split the loop by **stakes**, not by stage. The default is one capable model at varying effort;
reach for a second model only when a whole class of work is genuinely cheaper somewhere else.

| Work | Tier | Because |
| --- | --- | --- |
| Stage 1–2: requirements, architecture, decomposition | **Deepest tier available**, at `max` | One-shot decisions whose cost compounds across every later iteration |
| Loop: implementation, search, status reports, bookkeeping | **Default tier**, `high`→`medium` | High iteration count, well-specified steps, decisions made upstream |
| **Loop: verification and the ledger write** | **Default tier or better**, never below `high` | A false pass propagates silently and corrupts every decision built on it. This is the single error the whole workflow exists to prevent — do not economize here |
| Debugging something the loop has failed twice | **Deepest tier**, at `max` | Two failures means the problem isn't throughput |
| Stage 6: rollback and blast-radius reasoning | **Deepest tier**, at `max` | Irreversibility |
| Reading-heavy fan-out: search, locate, per-file triage | **Cheapest tier**, at `low` | Volume of reading, no judgement call at the end of it |

The asymmetry is the point: implementing a feature wrong is caught by verification; **verifying wrong is caught by nothing.** Cheap implementation with expensive verification is strictly better than the reverse, even though the reverse looks like the natural place to save.

### Which model is which tier — a snapshot, with its expiry

Written per the premise rule: a lineup is a fact about a date, so it is recorded with what ends it.

```
D-models — Claude Opus 5 is the default tier; Claude Fable 5 the deepest;
           Claude Sonnet 5 the throughput tier; Claude Haiku 4.5 the cheapest.
  Premise: this is the lineup as of August 2026.
  Expires if: a new model ships, or a price changes the ordering.
```

| Tier | Model | ID | Note |
| --- | --- | --- | --- |
| Deepest | Claude Fable 5 | `claude-fable-5` | Most capable; thinking always on. Single turns on hard tasks can run many minutes — plan for that rather than treating it as a hang |
| Default | Claude Opus 5 | `claude-opus-5` | Thinking on by default. The right base for almost every seat in this workflow |
| Throughput | Claude Sonnet 5 | `claude-sonnet-5` | When a whole class of loop work is well-specified and high-volume |
| Cheapest | Claude Haiku 4.5 | `claude-haiku-4-5` | Reading-heavy sub-agents; 200K context, unlike the 1M above it |

**Do not infer the ordering from the names.** Fable 5 costs more per token than Opus 5 and is
the *deeper*, not the faster, choice — an earlier version of this file had it backwards and named
Fable 5 as the cheap throughput base for the loop, which would have put the most expensive model
on the most repetitive work and a shallower one on verification. If a model string here looks
unfamiliar, that means the lineup moved past this snapshot, not that the string is wrong.

**When the premise expires, re-read the table above it, not this one.** The tier assignments —
deepest for irreversible calls, cheapest for reading — outlive any particular lineup. Only the
four rows naming models need rewriting.

---

## Delegating to sub-agents

Separate context is a stronger seat separation than a stated hat, because a fresh agent genuinely cannot inherit your blind spot.

| Situation | Delegate to | Why it helps |
| --- | --- | --- |
| Verifying a feature you just built | QA agent, given only `build-spec.md` + the feature's `steps` — **not** the cheap tier | Cannot rationalize an implementation it never saw |
| Locating code across an unfamiliar tree | explore/search agent, cheapest tier at `low` effort | Keeps grep noise out of the main context |
| Reviewing a large diff before commit | review agent | Fresh eyes, and the diff doesn't cost you context |
| A self-contained, well-specified sub-task | worker agent | Parallelism without shared-state risk |
| Work that fans out over many files or sources | several workers, cheapest tier, one scope each | Reading N things in one context is what fills it |

**The cheap tier is for reading, not for judging.** Fan-out, triage, and locating things are
volume problems and belong there. A verification seat is not — it ends in a claim you will build
on, and that is the one place in this workflow where economizing has no upside.

**Do not delegate:** requirements elicitation (the user is talking to you), design decisions (they need whole-build context), the commit itself, or anything where two agents would write the same files.

### The handoff contract applies harder to sub-agents

A sub-agent starts cold. Give it the goal, the acceptance criteria **verbatim**, the file paths, the definition of done, and what to report back. Never "continue what I was doing" — it cannot.

### Delegation safety

- Every delegated task gets an explicit **file allowlist**.
- Never run two delegated tasks whose allowlists intersect — a corrupted tree from concurrent writes is one neither agent can diagnose.
- **Commit before delegating anything that writes**, so the pre-delegation state is recoverable.

### Read the report as evidence, not verdict

A sub-agent reporting "all tests pass" without naming which tests has told you nothing. That is the same false pass the QA seat exists to catch, arriving from outside — and it is *more* dangerous than your own, because it wears the authority of an independent check.

Require the same shape you'd require of yourself: which steps ran, what was observed, what failed and what was done about it.
