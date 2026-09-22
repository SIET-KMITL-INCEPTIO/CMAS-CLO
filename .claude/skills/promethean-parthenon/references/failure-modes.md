# Failure Modes

How agent output goes bad. Every one of these produces something that *looks* like success — that is what makes them worth cataloguing, and why attention alone does not catch them.

Each entry: the tell, the real cause, and the pillar that fixes it. Task verdicts name which of its three skills carries the fix — **extract** (requirement-gathering), **brief** (agentic-engineering), or **build** (long-horizon-engineering-workflow).

---

## 1. Plausible code, invented requirements

**Tell:** it runs, it demos well, and a rule you never agreed to is baked in — a token that never expires, a limit that does not exist, a default nobody chose.

**Cause:** the ask had unanswered questions in it and the agent answered them silently. It did not flag the pick because from the inside there was nothing to flag.

**Fix:** **Task — brief.** Answer Q1–Q4 and convert every adjective in Q3 into a number, a boundary, or a prohibition.

**Cheapest detection:** read the code looking only for constants and defaults. Every magic number is a decision someone made. If it was not you, it was the agent.

---

## 2. Declared victory

**Tell:** "Implemented the feature" reported as done. Ledger says passing. Nobody watched it work end to end.

**Cause:** the signature failure of an unattended agent — nothing external held the definition of done, so "wrote the code" collapsed into "finished the work."

**Fix:** **Task — build.** Never claim a pass you did not observe. Unit tests passing ≠ the feature working; verify through the interface the consumer actually touches.

**Cheapest detection:** pick one passing feature at random and run its verification steps yourself. What you find generalizes.

---

## 3. Context amnesia

**Tell:** session two contradicts session one. A decision gets re-made differently. Work that was finished gets redone, or work that was never finished gets assumed.

**Cause:** state lived in the transcript. Compaction kept the gist and dropped the fact.

**Fix:** **Task — build.** `build-spec.md`, `feature-list.json`, `progress.md`, `init.sh` at the repo root. Cold sessions run the full bootstrap.

**Cheapest detection:** start a fresh session and ask it what is left to do. If it cannot answer from files alone, there is no state.

---

## 4. The silent rewrite

**Tell:** a verification step is subtly weaker than it was. A feature description shifted to match what got built. `passes` went true and never went back.

**Cause:** a failing check is friction, and the cheapest way to remove friction is to change the check.

**Fix:** **Task — build.** The ledger is append-mostly — only `passes` and `notes` change. A wrong target gets *superseded* in the open, never edited quietly.

**Cheapest detection:** `git log -p feature-list.json`. Any diff that touches a `description` or a `steps` array deserves an explanation.

---

## 5. The fourth copy

**Tell:** three date formatters. Two pagination helpers. A new `utils/` next to the existing `lib/`.

**Cause:** pattern recognition was skipped. An agent does not feel the weight of the codebase — it has no accumulating sense that this is the fourth time.

**Fix:** **Task — build**, Stage 2. Grep for the domain noun before writing a new module. Counter-rule: two similar things are not a pattern; wait for three.

**Cheapest detection:** search for the function name you are about to write, before you write it.

---

## 6. Shape mismatch

**Tell:** logic is correct, integration fails. `user_id` versus `userId`. A date that is a string on one side. Money in a float. An ID past 2⁵³.

**Cause:** data mapping was skipped — the most-skipped Stage 2 move and the one that produces the most integration defects in agent-written code.

**Fix:** **Task — build**, Stage 2 data mapping. Write the shape on both sides of every boundary and name where conversion happens — exactly once.

**Cheapest detection:** diff the field names at each boundary. Any pair that differs by case or convention is a conversion point that must be named.

---

## 7. Over-return

**Tell:** an endpoint returns the whole row. Password hashes, internal refs, and soft-delete flags reach the client.

**Cause:** returning the object is the shortest correct-looking code, and no rule said not to.

**Fix:** **Task — brief** (a prohibition: "never returns `email`, `passwordHash`, `internalRef`") plus **Task — build** (data mapping names what gets dropped).

**Cheapest detection:** open the network tab. Read one response in full.

---

## 8. Correct at n=10

**Tell:** works in dev, dies in production. A query inside a loop. Everything loaded to filter three items. No pagination.

**Cause:** algorithm design skipped the growth question. Code correct at small n and catastrophic at large n looks identical.

**Fix:** **Task — build**, Stage 2 algorithm design — name the per-record loop and state what happens at 100k.

**Cheapest detection:** count the queries for one request. More than a handful means a loop is hiding one.

---

## 9. The average answer

**Tell:** both options summarized fairly, no recommendation, no consequence named. Technically responsive, decision-shaped hole in the middle.

**Cause:** no judgment pass. Summarizing is the safe default and it feels like helpfulness.

**Fix:** **Role.** Name the call, the trade-off, and what it makes hard in six months.

**Cheapest detection:** ask "what would you do?" If the answer restates the options, the pillar was never engaged.

---

## 10. Competent execution of a bad decision

**Tell:** everything verified, every gate passed, and the thing should not have been built — or should have been built differently.

**Cause:** the build skill asks *is this built correctly*, never *should this be built*. It is designed not to ask.

**Fix:** **Role**, at the gates and before anything irreversible.

**Cheapest detection:** at each gate, restate the brief's **What** sentence and ask whether this still delivers it. It is one question and it occasionally saves the release.

---

## 11. The recurring bug

**Tell:** the same defect fixed a third time, in a third place.

**Cause:** it is not a bug, it is a design flaw wearing a disguise. The decomposition put a seam where there should not be one.

**Fix:** **Task — build.** Stop after three implement→verify cycles. Re-run decomposition and data mapping before a fourth attempt — the defect is upstream of where you are looking.

**Cheapest detection:** `progress.md`. If the same symptom appears twice, stop fixing and start re-decomposing.

---

## 12. Invisible work

**Tell:** "what did we ship this quarter?" cannot be answered without reading diffs. A decision gets re-argued with less context than it had originally.

**Cause:** no record, or a history of `wip` / `fix` / `update` that no report can group.

**Fix:** **Format.** Conventions first, report second — and generate from what is actually there rather than inventing structure the data does not contain.

**Cheapest detection:** `git log --oneline -30`. If you cannot tell what shipped, neither can a report.

---

## 13. Built against a system nobody read

**Tell:** the new code is correct on its own terms and wrong against the system it joins. A field the API already returns under a different name. A component that re-implements a prop the design system already exposes. A caller nobody knew about, broken.

**Cause:** the target was briefed as if the codebase were empty. Briefing is the right move for work that does not exist yet; it is the wrong move when the requirements are already sitting in code and merely unwritten.

**Fix:** **Task — extract.** Run requirement-gathering in REVERSE or GAP mode first, get the contracts on paper, and brief the delta against them.

**Cheapest detection:** before writing the brief, grep for the domain noun. If existing code owns it, the brief is being written against the wrong baseline.

---

## 14. The module that gets worse

**Tell:** every feature passes, every commit is green, and the file everyone touches is steadily less workable. Duplication that arrived one iteration at a time. Scaffolding left in from three features ago.

**Cause:** the inner loop stopped at commit. Each individual iteration's mess was too small to be worth stopping for, which is exactly why it accumulates — nothing in the loop was ever responsible for cleaning it.

**Fix:** **Task — build.** The refactor box is part of the loop, not an optional afterward: implement → verify → refactor what this feature touched → ledger → commit. Bounded to the diff, re-verified against the same steps.

**Cheapest detection:** `git log --stat` on the worst file. If it grows in every commit and shrinks in none, no iteration ever cleaned up after itself.

---

## The meta-tell

**An agent that never pushes back on an ambiguous ask is not being efficient.** It is guessing quietly. Silence on a genuinely under-specified request is the single most reliable indicator that failure mode 1 is already in progress — and mode 1 is the one every other mode compounds on top of.
