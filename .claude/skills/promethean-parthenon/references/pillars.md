# The Three Pillars

**Role · Task · Format.** What each pillar holds, what it hands to the next, and how it cracks. Read the pillar you are standing in; skip the rest.

---

## Pillar 1 — Role

**Skill:** [senior-leadership-advisor](../bundled/senior-leadership-advisor/SKILL.md)
**Holds:** the seat. Who is answering, to what standard, and what call they make.
**Hands off:** a decision with its consequences named, in writing.

The other two pillars are process. This one is the thing process cannot supply: a position. An agent asked "should we use Kafka or SQS" will summarize both well and recommend neither — which is a search result, not an answer.

**Setting a role is not flavor text.** It selects the failure modes the answer gets checked against. A staff backend engineer and a security lead reviewing the same endpoint do not disagree about the code; they disagree about what counts as finished. Naming the seat is how you choose which of those questions gets asked.

**This pillar is stepped into, not passed through.** It carries load at exactly four places:

1. **At the gates** — is this the right design, not just a valid one?
2. **On any feature that failed twice** — a second failure usually means the decomposition was wrong, not the implementation.
3. **When the target and reality disagree** — someone has to decide which one changes.
4. **Before anything irreversible** — a migration, a public API, a schema everyone will build on.

Everywhere else it is dead weight. Running a pre-mortem on a routine loop iteration is spend with no return; those decisions were made upstream.

**How it cracks:**

| Crack | Tell | Fix |
| --- | --- | --- |
| Narrating the seat | "As the architect, I would say…" | Occupy it — the switch changes the work, not the wording |
| Both-sides summary | Trade-offs listed, no recommendation | Name the call, then the cost of being wrong |
| Applied everywhere | Deep passes on trivial iterations | Reserve it for the four places above |
| Consequences unstated | A confident answer with no six-month view | What does this make hard later? |
| Wrong seat, competently occupied | Thorough answer to a question nobody was asking | Re-detect the discipline before re-answering |

---

## Pillar 2 — Task

Three skills, one ordering rule: **you cannot build against a target you have not written down.** The first two skills write it — from different sources — and the third builds against it.

### 2a — Extract the target: requirement-gathering

**Skill:** [requirement-gathering](../bundled/requirement-gathering/SKILL.md)
**Holds:** what the system already does and already promises.
**Hands off:** `REQ-*` items with acceptance criteria, component/API/DB contracts, an NFR scorecard, and an explicit assumptions block.

Use it when the requirements live in **code rather than in someone's head.** It runs in one autonomous pass — detect stack and layers, extract contracts, generate requirements, annotate everything inferred — and never stops to ask permission.

Its three modes decide what you get: **REVERSE** (extract what exists), **FORWARD** (define what to build), **GAP** (current vs. target). Gap mode is the one that matters when extending a live system: it names the delta rather than re-describing the whole.

**How it cracks:**

| Crack | Tell | Fix |
| --- | --- | --- |
| Inference presented as fact | Requirements read as certain, no annotations | Every derived item carries `[INFERRED]`, `[ASSUMED]`, or `[MISSING]` |
| Extraction mistaken for approval | The extracted behavior gets treated as the intended behavior | What exists is evidence, not a specification — a bug faithfully documented is still a bug |
| Contracts skipped | Requirements but no request/response or schema shapes | The contract is the part downstream code actually binds to |

### 2b — Write the target: agentic-engineering

**Skill:** [agentic-engineering](../bundled/agentic-engineering/SKILL.md)
**Holds:** the target for work that does not exist yet. What is being created, for whom, under what limits, proven how.
**Hands off:** a one-page brief with numbered rules (R), prohibitions (N), and proofs (P).

An agent will build almost anything you describe, and it will not tell you that your description had four unanswered questions in it. It answers them itself, silently. The brief is the only thing that converts those silent answers into visible ones.

**The four questions:** what is being created · for whom · what are the limitations · how will it be proven complete and correct. Q1–Q2 stop you building the wrong thing; Q3–Q4 stop you shipping the right thing broken.

**How it cracks:**

| Crack | Tell | Fix |
| --- | --- | --- |
| Adjectives instead of rules | The brief says "secure", "fast", "simple" | Convert each to a number, a boundary, or a named forbidden case |
| No prohibitions | The **Must never** list is empty | Every system has them; an empty list means you did not look |
| Proof written after the code | The proof list describes what got built | Write P before the build; it is a specification, not a summary |
| Assumed scope | No **Out of scope** section | People under-specify scope far more often than they over-specify it |

**Cost of skipping:** a rebuild you will mistake for a bug fix. This is the cheapest move in the whole system — minutes — and the most expensive to omit, because everything downstream inherits the wrong target.

### 2c — Build against the target: long-horizon-engineering-workflow

**Skill:** [long-horizon-engineering-workflow](../bundled/long-horizon-engineering-workflow/SKILL.md)
**Holds:** the build. Six gates around a per-feature inner loop, backed by on-disk state.
**Hands off:** verified commits, a ledger that matches reality, and a progress log a cold session can read.

Two distinct failure classes, needing two distinct defenses. **Quality failures** — vague requirement built wrong, edge cases in production — are what gates fix. **Horizon failures** — context decay, a session starting blind, and the signature failure of an unattended agent, *declaring victory* — are what the harness fixes. The gates decide what "done" means; the harness makes that decision survive you.

**Stage 2 runs computational thinking** as its method: decomposition (→ the ledger), pattern recognition (→ reuse), abstraction (→ the interface), algorithm design (→ the branch-by-branch flow), data mapping (→ the contract at every boundary). See [computational-thinking](../bundled/long-horizon-engineering-workflow/references/computational-thinking.md).

**The inner loop ends in a refactor.** Implement → verify → **refactor what you just touched** → ledger → commit. The cleanup is bounded to the feature's own diff and re-verified against the feature's own steps, which is what keeps a long build from accumulating the debt every individual iteration was too small to notice. See [feature-loop](../bundled/long-horizon-engineering-workflow/references/feature-loop.md).

**Between the build and the feature sits the phase — and a phase is a branch, one to one.** A sprint is the same unit cut by date instead of by scope. The ratio is fixed at that level and open below it: sub-branches are allowed, and each has to name the reason it exists rather than being a commit on the phase branch. The 1:1 buys three things — a revert whose cost is one merge, a close-out that has to be demonstrated rather than asserted, and a range a report can be generated from. Cut phases *before* features, grouped by shared premise, so an expired premise costs one phase and not the ledger. See [phases-and-branches](../bundled/long-horizon-engineering-workflow/references/phases-and-branches.md).

**How it cracks:**

| Crack | Tell | Fix |
| --- | --- | --- |
| Ledger drift | Bugs fixed off-ledger; `passes` never moves backward | Append-mostly; a regression gets recorded immediately, even when embarrassing |
| Features too big | Cannot write 3–7 verification steps for one | Re-decompose; split along user-observable behavior |
| Declared victory | "Implemented" reported as done | Verify end to end through the interface the consumer actually touches |
| Transcript-only state | Session two contradicts session one | `build-spec.md`, `feature-list.json`, `progress.md` at the repo root |
| Layer-wise splitting | All models, then all controllers, then all UI | Nothing is verifiable until the end — that is the same as no ledger |
| Refactor step skipped | Working code, and the module is worse every iteration | It is a loop box, not an optional one; scope it to the diff and re-run the steps |
| No phase, or a phase with no branch | Everything on one long-lived branch, or straight onto `main` | One phase, one branch — otherwise "revert the phase" is archaeology |
| Branches nobody can classify | A `wip/` or `spike/` branch the next session finds and cannot place | Every sub-branch's reason is written in `progress.md` when it is cut |
| Phases grouped by topic | A branch named for a subject — `styling`, `cleanup`, `the header` | Group by contract: does anything consume what this task produces? Subject matter is not coupling |
| Over-compressed branches | One branch holds three phases; something breaks and nothing isolates it | Compression is only safe across phases the dependency test found independent, and it always costs rollback resolution |

**Cost of skipping:** on anything past ~10 sub-tasks or one session, the build silently stops matching its own record. Below that, the gates carry it alone and the harness is overhead.

---

## Pillar 3 — Format

**Skill:** [github-report](../bundled/github-report/SKILL.md)
**Holds:** the shape the output takes, and what survives after the work is done — built from commits, PRs, and issues rather than memory.
**Hands off:** a written report, grouped by sprint, feature, function, or section.

The pillar people treat as optional, and the one that decides whether the previous two compound or evaporate. Work nobody can see gets rebuilt. A decision nobody wrote down gets re-argued next quarter with less context than it had the first time.

**Format is upstream of itself.** A report is only as good as the records it is built from, which makes this pillar partly retroactive: commit and PR conventions are what make a report possible at all. Deciding the output shape *before* the build is what makes the build produce data in that shape. If the history is `wip`, `fix`, `update`, say so and generate from what is actually there rather than inventing structure the data does not contain.

**The phase is where this pillar's grouping comes from.** "Grouped by sprint" is only real if something in the build produced a sprint — one phase, one branch, one merge — and a report that groups by a sprint the build never had is a shape imposed on the data rather than read from it. This is the clearest case of Format reaching backwards into Task: the phase plan written at Stage 2 is what makes the report at the end derivable instead of remembered.

**How it cracks:**

| Crack | Tell | Fix |
| --- | --- | --- |
| Written from memory | The report mentions work with no commit behind it | Build from `git log` and `gh`; if a claim has no record, drop it |
| Ambiguous window | "Last two weeks" in the header | Absolute dates, always — a report whose range is ambiguous cannot be re-run |
| Activity, not outcomes | "Worked on auth" | "The login flow is complete and tested" |
| Conventions assumed | Grouping silently inferred from noise | State that the grouping is inferred, and on what basis |
| Format decided last | Nothing in the history supports the grouping you want | Choose the output shape at the start; it is a constraint on the build, not a report-time choice |

---

## The load path, restated

Role fixes who is answering and to what standard. Task fixes the target — extracted or briefed — and makes hitting it survivable across sessions. Format makes the result visible and the decisions re-findable.

The pillars are not equally expensive, and they are not equally skippable:

| Pillar | Cost to run | Cost to skip |
| --- | --- | --- |
| Role | Minutes, at four moments | One expensive wrong turn, executed competently |
| Task — extract | Minutes, automated | New code that contradicts contracts the system already publishes |
| Task — brief | Minutes | A rebuild, misdiagnosed as a bug |
| Task — build | Hours, front-loaded | Drift — unbounded on a long horizon |
| Format | Under an hour | Invisible work, re-argued decisions |

**The front of Task has the best ratio by an order of magnitude.** That is why it is the default when routing is unclear.
