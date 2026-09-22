# The Five Levers

What actually changes the quality of agent output, ranked by effect. The ranking matters more than the list: effort spent on lever 5 while lever 1 is broken is wasted, and that is the usual mistake.

---

## Lever 1 — Specificity of the target

The largest lever by a wide margin, and the cheapest to pull.

An agent resolves ambiguity by picking. It does not flag the pick. So every vague word in your ask is a coin flip you did not know was being flipped, and the result compiles either way.

**The conversion rule:** every adjective becomes a number, a boundary, or a named forbidden case.

| Vague | Specific |
| --- | --- |
| "Make it secure" | "An attacker with the email address cannot confirm the account exists" |
| "Handle errors properly" | "Mail provider down → token still issued, send retried, user sees the generic response" |
| "Should be fast" | "p95 under 300 ms at 50 req/s" |
| "Don't let people abuse it" | "Max 3 per email per hour; the 4th returns the same response and sends nothing" |
| "Clean it up" | "No function over 40 lines; no duplicate of an existing util in `lib/`" |

**The sharpest form is a prohibition.** "Must never return the password hash" is more useful than any amount of positive description, because it is already a test and it fails loudly.

**Where this lever lives:** Task — the brief's **Rules** and **Must never** sections are this lever, written down. When the target is an existing system, extraction supplies it instead: a contract you read beats a rule you guessed.

---

## Lever 2 — Verification you actually ran

Second largest, and the one most often faked.

**Implementation errors get caught by verification. Verification errors get caught by nothing.** That asymmetry is the whole argument for spending depth on the verify step even when the implementation was trivial.

Ranked by strength — use the strongest the check permits, but a weaker check that runs beats a stronger one you describe and skip:

| Proof | Strength |
| --- | --- |
| Automated test | Strongest — survives the next change |
| Executed script, query, or log scan | Strong, one-shot |
| Manual run with recorded output | Real, does not survive |
| Code reading | Weak — states presence, not behavior |
| "Looks right" | Not proof |

**A test that has never failed has proven nothing.** For each prohibition, confirm the check fails when the prohibition is violated. A test asserting `expect(rejected).toBe(true)` against an endpoint that rejects *everything* is green and worthless.

**The reporting rule:** three permitted verdicts — passed, failed (with actual output), not run (with the reason). "Not run" is a legitimate outcome. Hiding it is not, and declaring victory over unverified work is the characteristic failure of an unsupervised agent.

**Where this lever lives:** Task — the brief writes the proof list; the build loop runs it and records the result in the ledger.

---

## Lever 3 — State that outlives the conversation

The lever that only matters past a certain length, and then matters completely.

**Anything living only in the transcript is not state.** Compaction preserves the gist and drops the fact — and the fact is what you needed: the exact rate limit, the reason you rejected the first approach, which of the 40 features were actually verified.

Four files, at the repo root, from Stage 2:

| File | Answers |
| --- | --- |
| `build-spec.md` | What are we building, and what counts as done? |
| `feature-list.json` | Which sub-tasks exist, and which actually pass? |
| `progress.md` | What happened, what is blocked, what is next? |
| `init.ps1` / `init.sh` | How do I get a working environment in one command? |

Git history is the fifth, and the only one a confused agent cannot silently rewrite.

**The threshold:** below ~10 sub-tasks and one session, skip the harness — the gates carry it alone and the files are overhead. Above it, the absence of state is why session two contradicts session one.

**Where this lever lives:** Task — the build harness.

---

## Lever 4 — Effort placed at decisions, not iterations

Not "think harder" — *think harder in the right places*. Attention is finite, and spreading it evenly is the same as spending none of it where it counts.

**This lever now has a literal dial.** Current Claude models take a reasoning effort setting —
`low` · `medium` · `high` · `xhigh` · `max` — so "spend depth here, not there" is a parameter
rather than a wish. Reach for it before reaching for a different model: it moves depth further
than most model swaps, and unlike a swap it keeps one set of behaviours in play. Thinking is
adaptive on these models, so a fixed thinking-token budget is a retired concept; if you are
carrying one forward, replace it with an effort level.

**Spend it at:**

- Stage 1–2 gates — requirements and design
- Decomposition — because its output is the ledger, and a bad decomposition poisons every downstream loop
- Data mapping — the most-skipped, least-survivable Stage 2 move
- Any feature that has failed twice
- Anything irreversible: a migration, a public API, a schema others will build on
- The verify step and the ledger write, always — see lever 2

**Do not spend it on:** routine loop iterations. Those decisions were made upstream. A pre-mortem on the fourth CRUD endpoint is ceremony.

**The stop rule that saves the most time:** after three completed implement→verify cycles on the same thing, stop and re-read the requirement and the design. A fourth attempt will not find what three missed — the defect is upstream of where you are looking.

**Low effort is a setting, not a downgrade.** It buys terser output and fewer, more consolidated tool calls — often what a routine iteration actually wants. Raising effort on a well-specified sub-task mostly buys deliberation over a decision that was already made upstream.

**Where this lever lives:** Task — the build gates; Role — its four moments.

---

## Lever 5 — Scope held still

The smallest of the five, and the one people mistake for the largest.

Two things look identical and are opposites:

- **A growing feature list** is discovery working. You learn what the build actually contains as you build it. Expected, healthy, do not fight it.
- **A drifting acceptance criterion** is the build going wrong. The definition of done is moving to meet whatever got built.

**What Stage 1–2 fix is the acceptance criteria, not the implementation plan.** Criteria stable, feature list free to grow.

The ledger enforces this structurally: it is append-mostly. Only `passes` and `notes` change. Never delete a feature, edit a description, or loosen a verification step because it is failing. If the target is genuinely wrong, surface it and supersede — mark the old feature superseded in `notes`, append a corrected one with a new ID. Never silently.

**Where this lever lives:** Task — the ledger invariants; Role — when a criterion genuinely needs to change.

---

## What is *not* a lever

Worth naming, because effort goes here by default:

- **Prompt length.** A longer vague prompt is still vague. Specificity is the lever; volume is not.
- **Politeness, urgency, or stakes framing.** "This is critical" does not add information.
- **Restating the same requirement in three ways.** It adds tokens and no constraints.
- **Model choice, mostly.** It is real but far smaller than levers 1–3, and it cannot rescue an unspecified target. A better model builds the wrong thing more competently.
- **Asking the agent to "be careful" or "double-check".** Compare to lever 2: a named check that runs is worth more than any amount of instructed diligence.

---

## The one-line diagnostic

If output quality is bad, check the levers in order and stop at the first broken one. It is lever 1 far more often than anything else — and lever 1 is the one that costs ten minutes to fix.
