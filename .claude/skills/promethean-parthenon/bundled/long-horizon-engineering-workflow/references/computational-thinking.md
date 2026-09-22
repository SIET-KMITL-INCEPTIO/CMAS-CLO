# Computational Thinking (Stage 2 method)

[design-and-architecture](design-and-architecture.md) says *what* Stage 2 must produce. This file is *how* to produce it.

Five moves, run in order. They are not academic vocabulary — each one has a named output that lands in a harness file, and each one prevents a specific failure that shows up later at ten times the cost.

| Move | Question it answers | Output lands in |
| --- | --- | --- |
| **Decomposition** | What are the pieces, and which is the critical path? | `feature-list.json` |
| **Pattern Recognition** | What here already exists, or repeats? | design notes + reuse decisions |
| **Abstraction** | What can I ignore, and what is the interface? | the contract in `build-spec.md` |
| **Algorithm Design** | What is the exact sequence, including every branch? | logic flow in `build-spec.md` |
| **Data Mapping** | What shape goes in, what comes out, at every boundary? | data contract in `build-spec.md` |

Run them in that order. Decomposing before you know the data shapes is normal; designing the algorithm before decomposing is how you get one 400-line function that no ledger can track.

---

## 1. Decomposition

Break the build into pieces that can each be finished, verified, and committed independently.

**The test of a good piece:** you can write 3–7 observable verification steps for it *right now*, without building anything else first. If you cannot, it is either too big (split it) or it depends on something unbuilt (that dependency is the real next feature — declare it in `depends_on`).

Split along these seams, in preference order:

1. **User-observable behavior** — "user can request a reset link" is a feature; "add the token table" is a step inside one.
2. **Boundary crossings** — each API call, each queue hop, each third-party call is a natural edge.
3. **Failure isolation** — if piece A breaks, can you still verify piece B? If not, they are one piece.

Never split by technical layer alone. "Build all the models, then all the controllers, then all the UI" produces a ledger where nothing is verifiable until the end — which is the same as having no ledger.

**BAD** — `F001: Build the authentication system`
**BETTER** — `F001: user can sign in with email + password and land on the dashboard` · `F002: invalid credentials show an inline error and do not create a session` · `F003: session survives a page reload`

Depth rule from the main skill still applies: specify the critical path in full (~10–15 features), stub the rest with description and priority and `"steps": []`.

---

## 2. Pattern Recognition

Before designing anything, look for what already exists. This is the single highest-leverage move when working with an agent, because **an agent will happily build the fourth variant of something you already have** — it does not feel the weight of the codebase the way you do.

Search before designing:

- Does this codebase already solve this? Grep for the domain noun before you write a new module.
- Do several of the decomposed features share a shape? Three "list with filter and pagination" screens are one pattern and one component, decided now, not refactored later.
- Does this repeat over *time* rather than space — the same operation on every record, every request, every deploy? That is where a small inefficiency compounds.
- Has this failure happened before in this build? Check `progress.md`. A bug that recurs is a design flaw wearing a disguise.

**The counter-rule:** two similar things are not a pattern. Abstracting on the second occurrence produces a wrong abstraction that the third occurrence has to fight. Wait for three, or for a stated requirement that they stay identical.

---

## 3. Abstraction

Decide what to ignore. An abstraction is a promise about what a caller does *not* need to know.

For each piece, write one line: **what it takes, what it guarantees, what it hides.**

```
sendResetEmail(email) → queued | rejected
  hides: provider choice, retry policy, template rendering
  guarantees: never throws on a bad address; never reveals whether the account exists
```

Rules that keep abstractions honest:

- **The interface is the contract, and the contract is the thing tested.** If a verification step reaches past the interface into internals, either the step is wrong or the abstraction is.
- **Hide the volatile part.** Abstract over the thing most likely to change — the provider, the storage, the format. Do not abstract over something stable; that is ceremony.
- **A leaky abstraction is worse than none.** If callers must know the internals to use it correctly, delete the layer and let them see the real thing.
- **Name it for what it does, not how.** `sendResetEmail` survives switching mail providers; `sendgridReset` does not.

---

## 4. Algorithm Design

The exact sequence, written before code, branch by branch. This is the Stage 2 logic flow requirement made concrete.

Method:

1. **Happy path first**, numbered, in plain language. No code.
2. **Then walk every step and ask what if.** Empty input. Failed call. Timeout. Called twice. No permission. Partial data. Out of order.
3. **Every "what if" becomes a numbered branch or an explicit non-case.** "Cannot happen because the caller validates" is a fine answer — write it down, because that is now an assumption someone can violate.
4. **State the complexity when the input can grow.** Not as an exercise: name the loop that runs per-record and what happens at 100k records. Most agent-written code is correct at n=10 and catastrophic at n=10⁶, and it looks identical.

The finished flow should be readable by someone who cannot write code. If it is not, it is pseudocode, and pseudocode hides the same gaps that code does.

---

## 5. Data Mapping

The move that classic computational thinking leaves out and agent-assisted work cannot survive without. **The majority of integration bugs in agent-built code are shape mismatches, not logic errors** — the logic is right and the field is called `user_id` on one side and `userId` on the other.

For every boundary, write the shape on both sides and the transform between:

| Boundary | In | Out | Transform |
| --- | --- | --- | --- |
| API → service | `{ email: string }` | `{ userId: uuid, token: string }` | validate, normalize case |
| service → DB | `{ userId, tokenHash, expiresAt }` | row | hash token, compute expiry |
| DB → API response | row | `{ ok: true }` | drop everything internal |

Then check each one against these:

- **Naming convention at each edge.** `snake_case` in the database, `camelCase` in TypeScript — say where the conversion happens, exactly once. Two conversion points is a bug waiting.
- **Nullability.** Which fields can be absent, and what does the consumer do then? "It shouldn't be null" is not a mapping.
- **Types that lie.** Dates as strings, money as floats, IDs as numbers that exceed 2⁵³. Name the representation, not just the concept.
- **What gets dropped.** Every field the response does *not* include is a decision. Internal IDs, hashes, and timestamps leak by default when an agent returns whole rows.
- **Where validation happens.** Once, at the edge — not scattered through every layer, and never only on the client.

**BAD** — "The endpoint returns the user."
**BETTER** — "Returns `{ id, displayName, avatarUrl }`. Never `email`, `passwordHash`, or `internalRef`. `avatarUrl` is `null` for users who never uploaded one; the client renders initials in that case."

---

## When to run this

- **Fully at Stage 2**, before the first line of code, for anything user-facing or multi-component.
- **Partially at decomposition time** whenever a stubbed feature gets promoted to the critical path — it has not been through moves 3–5 yet.
- **On any feature that has failed twice.** A second failure usually means the decomposition was wrong, not the implementation. Re-run moves 1 and 5 before attempting a third fix; the third attempt is also your last before the stop rule in [safety-and-invariants](safety-and-invariants.md) §12.

**Skip it** for a small, well-specified change inside an existing pattern. The moves are a thinking budget, and spending it on a one-line fix is the same waste as skipping it on a new subsystem.

---

## Failure mode this prevents

Code that is locally correct and globally wrong: pieces that cannot be verified independently, the fourth copy of an existing utility, an interface that leaks its internals, a happy path with no branches, and a data contract that only existed in the conversation — which is exactly the part that does not survive to the next session.
