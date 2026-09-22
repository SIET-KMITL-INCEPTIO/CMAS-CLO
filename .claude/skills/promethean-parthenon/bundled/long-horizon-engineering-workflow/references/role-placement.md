# Role Placement — who stands where, and what moves between them

A gate without an owner is a gate nobody closes. In a human team the seats are separate people; on a solo long-horizon build you occupy all of them — but you must occupy them **distinctly**, because the value is the change in viewpoint, not the change in headcount.

The failure this prevents: the person who wrote the code is the worst possible person to verify it, and knows it least.

This specializes a general role protocol — lead selection, a conflict ladder, and handoff contracts — that also exists elsewhere as a standalone catalog of roughly 50 seats across software, IoT, design, content, management, and silicon tracks. Everything needed to run this workflow is restated below; nothing here depends on that catalog existing.

For how to allocate effort across seats — sub-agents, model tiers, where to spend deep thinking — see [delegation-and-models](./delegation-and-models.md).

---

## The station map

| Stage / loop step | Lead seat | The question that seat asks | Owns the gate |
| --- | --- | --- | --- |
| 1 Requirements | Product Manager | "What problem, and how will we know it's solved?" | Tech Lead |
| 2 Design | Architect (+ UX if user-facing) | "What breaks, and what shape is the data?" | Tech Lead |
| — Decomposition | Tech Lead | "Is each sub-task independently verifiable?" | — |
| 3 Development | Engineer | "Is this the smallest correct change?" | Self-review vs. Stage 1 |
| — Verification | QA | "How would I prove this is broken?" | QA — **not** the Engineer |
| 4 Integration QA | QA | "What breaks only when these features meet?" | Tech Lead |
| 5 UAT | The actual user | "Does this do what I asked for?" | User sign-off |
| 6 Deployment | Release Engineer | "How do I undo this at 2am?" | Named watcher |
| Throughout | Security | "What does an adversary do with this?" | [safety-and-invariants](./safety-and-invariants.md) |
| Throughout | **Harness Owner** | **"Will the next session find this, and believe it?"** | [harness-state](./harness-state.md) |

**Why the Harness Owner is a seat and not a chore.** Every other seat on this map serves the
build; this one serves the *next session*, which is the only participant who cannot speak up when
something is missing. The gap is real and was measured: a harness was once written to a path the
repo's `.gitignore` matched, so nothing was tracked. Invariants 7, 8 and 9 all reason from *"they're
tracked, so…"* — every one of them quietly stopped holding, and a cold session would have
bootstrapped into an empty room. Nobody noticed because the Release Engineer asks how to undo a
deploy, not whether the state survives the conversation.

This seat is occupied at three moments and no others: when the harness is created, when a feature
is recorded, and at teardown. Its evidence is never prose — it is the `git check-ignore` that ran,
the ledger field that says `blocked` rather than a passing note that admits a gap, and the commit
that exists.

Leads are selected by the standard rules — **deliverable owner, consequence owner, or whoever can isolate the cause** — never by who knows the most. Supports join only when a lens genuinely changes the recommendation, its risk, or its sequencing; a seat that changes nothing should be empty. Pull additional seats from the catalog when a build needs a discipline this table lacks: an IoT build wants the IoT Architect at Stage 2, a silicon-adjacent one wants DV at Stage 4.

---

## The switch is a work step, not a voice

The general protocol's rule is **detect, assume, answer — never announce the role**, because a nameplate carries no information and four headings restating one point is padding.

That rule governs *how you talk*. This skill governs *what you do over time*. The distinction resolves cleanly:

**The switch is real and must actually happen — it changes the work, not the wording.** Occupying the QA seat means opening `build-spec.md` and executing the feature's verification steps. It does not mean writing "🎩 **As QA:**" above a paragraph.

| | Announce in prose | Evidence appears in |
| --- | --- | --- |
| Engineer → QA switch | No | The verification output: which steps ran, what was observed |
| Architect concern at Stage 2 | No | The failure-behavior section of `build-spec.md` |
| Security lens | No | Security features in the ledger, with real steps |
| Release Engineer at Stage 6 | No | The written rollback plan |

BAD — role theater, and it verified nothing:
> **As the Engineer:** implemented the reset flow. **As QA:** looks correct to me. **As Security:** should be fine since we hash the token.

BETTER — same three seats, none named, and every claim is checkable:
> F014 done. Ran all five steps: expired link returned 500 instead of a clean error, fixed to 410 with a message, re-ran clean. Tokens are single-use — verified by replaying a consumed link, which now rejects. Committed as `feat(F014)`.

If you cannot produce the second kind of sentence, you didn't occupy the seat — you described occupying it.

**Two rules that keep the switch honest:**

- **QA reads the acceptance criteria, not the diff.** Verifying by re-reading your own implementation verifies only that it does what it does.
- **The Architect answers "what breaks," the Engineer answers "what works."** Letting the second voice answer the first question is how edge cases become incidents.

**Narration budget:** one line per loop iteration — feature ID, what was verified, what was observed. One line per stage transition. That is the whole reporting surface. More than that is the theater this section exists to prevent.

---

## Handoffs carry a payload

A handoff without its artifact is where multi-seat work leaks. On a long build the "next seat" is frequently a future session with no memory, which makes the payload the *only* thing that transfers.

| Handoff | What must travel with it |
| --- | --- |
| Requirements → Design | Problem statement, numbered acceptance criteria, explicit out-of-scope, edge cases |
| Design → Decomposition | Data contract, failure behavior per boundary, state ownership, UI states |
| Decomposition → Loop | `feature-list.json`: IDs, observable steps, `depends_on`, priorities |
| Engineer → QA (per feature) | The diff, plus which of the feature's steps were run and what was observed |
| Loop → Stage 4 | Ledger matching reality, full suite green, and the list of what was **never** verified |
| Stage 4 → UAT | A script drawn from Stage 2 use cases — not written fresh at Stage 5 |
| UAT → Deployment | Recorded sign-off, not assumed from silence |
| Deployment → Operations | Rollback plan, smoke test, named watcher |
| **Any session → next session** | `progress.md`: blockers, and the single highest-value next action |

The last row is what this workflow adds to the general table, and the one most often skipped. See [harness-state](./harness-state.md).

---

## When the seats disagree

Same conflict ladder as the general protocol. What matters here is that long-build disagreements are *predictable*, so the resolutions can be decided in advance rather than argued each time:

| Live conflict | Rung | Resolution |
| --- | --- | --- |
| Engineer: "it works." QA: "step 4 was never run." | 1 — facts | Not a judgment call. Run step 4. |
| Engineer wants to mark it passing; QA won't sign the failure case | 2 — risk appetite | QA owns the consequence of a false pass. QA wins. |
| Architect wants a refactor; Tech Lead wants the next feature | 3 — priority | Lead decides, and files the refactor as a ledger feature with a stated cost of deferral |
| Requirement is ambiguous in a way that changes the build's shape | 4 — deadlock | Escalate **with a decision rule**: "if X matters more, do A; if Y, do B" |
| Same feature failed three implement→verify cycles | 4 — deadlock | Stop. Re-read requirement and design; a fourth attempt won't find what three missed |

Only rung 4 reaches the user, and it arrives as a decision with criteria attached. "Perspectives differ" is not an ending — and on a long build it is worse than useless, because it leaves the ledger ambiguous for every session that follows.

---

## When not to bother

A three-feature build doesn't need the full map. Below ~10 sub-tasks, keep two seats — Engineer and QA — and make sure the QA seat is genuinely occupied before anything is called done. That single separation catches most of what the full map catches, because it is the one that stops false passes.
