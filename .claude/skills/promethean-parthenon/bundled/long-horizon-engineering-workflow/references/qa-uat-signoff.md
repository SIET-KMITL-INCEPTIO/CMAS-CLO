# QA, UAT & Deployment (Stages 4–6)

## Stage 4 — Integration QA

**This is not a re-run of Stage 3.** The inner loop already verified every feature against its own steps; repeating that is duplicated work and it finds nothing new. Stage 4 exists for the classes of failure that per-feature verification *structurally cannot* catch — the ones that only appear when features meet.

- [ ] **Cross-feature integration** — pairs and chains that pass alone and fail together. Shared state, shared stores, conflicting assumptions about the same data.
- [ ] **Full user journeys** run end to end across several features, in one sitting, the way a real user would.
- [ ] **Re-verify features that passed early.** A feature marked `true` at F005 has had forty commits land under it since. Spot-check the `critical` and `high` ones.
- [ ] **Load, concurrency, and resource behavior** — parallel requests, repeated calls, long-running sessions. Single-feature checks never see these.
- [ ] **The gap list** — everything the ledger records as never verified: stubbed features, accepted blockers, exclusions. State what is shipping unverified, explicitly.
- [ ] Full regression suite green.
- [ ] No critical or high-severity issues left open.

If a Stage 2 use case was never written, testing here degrades into guesswork — go back and write it rather than testing blind.

**Define and validate the output, before you call something done:** write down what the expected output actually is — the data shape, the UI state, the API response — *before* writing the function, and use that written definition as the test case at the end. Compare the actual output to it directly rather than eyeballing whether it "looks right." Where it matters, get a second look — a fresh read catches what the person who wrote the code stops seeing.

## Stage 5 — UAT

UAT is not the first time the user sees the feature. If it is, the earlier stages were skipped, not skippable.

**Don't stall the build waiting for sign-off.** On a build spanning days, a single synchronous gate at the end parks everything. Run UAT **per feature-group as groups complete** — a coherent slice the user can actually exercise — and hold one consolidated sign-off before Stage 6. That batches the user's attention instead of blocking on it, and surfaces a misread requirement while it's still cheap to fix.

- [ ] UAT script prepared from the Stage 2 use cases, not written from scratch at this stage.
- [ ] Tested in an environment that matches what's described as production-equivalent.
- [ ] Tested by someone in the actual user role — not just by whoever built it.
- [ ] Feedback captured using [structured-feedback-format](./structured-feedback-format.md).
- [ ] Sign-off — even an explicit "looks good, ship it" from the user — recorded before deployment, not assumed from silence.

## Stage 6 — Deployment

- [ ] Deployment plan stated, even briefly: what's shipping, in what order.
- [ ] Rollback plan named before shipping, not improvised after something breaks.
- [ ] Monitoring or a smoke-test step named for right after deploy.
- [ ] Who's watching the release window is clear, even if that's just "I'll check back after this lands."

## Leaving a written trail

The last of the five core skills: produce artifacts that let anyone — including a future you, in a session that's lost this context — understand, test, and maintain the work.

- A short note for every feature: what it does, how to configure or invoke it, known limitations.
- Keep the use case document current through development — update it the moment scope changes, not at the end.
- Store artifacts somewhere durable (the conversation, a file, a doc) rather than letting the only record live in your own working memory for the session.

**Failure mode this whole section prevents:** the only place the system is understood is the developer who built it — and on a long, multi-session build, that "developer" might just be an earlier, now-inaccessible part of this same conversation.