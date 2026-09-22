# <project name> — Build Spec

The source of truth. Stage 1 and Stage 2 output, in one file, read at every session start.
If the code and this document disagree, **stop and resolve it** — do not quietly follow the code.

---

## 1. Problem  *(Stage 1)*

<1–3 sentences. The problem, not the feature. Who has it, and what it costs them.>

## 2. Acceptance criteria  *(Stage 1)*

Numbered and testable. "Fast" and "intuitive" are not criteria.

1.
2.
3.

## 3. Out of scope  *(Stage 1)*

Explicit. Things that sound related and are not being built.

-

## 4. Inputs, outputs, dependencies  *(Stage 1)*

- **Inputs:** <shape and types of what comes in>
- **Outputs:** <shape and types of what goes out>
- **Depends on:** <services, APIs, features this touches>

## 5. Edge cases and error states  *(Stage 1)*

- Empty / missing input →
- Downstream failure or timeout →
- Called twice / concurrently →
- Unauthorized →

---

## 6. Architecture  *(Stage 2)*

- **Stack:** <frontend, backend, data, infra>
- **Components and boundaries:** <what talks to what, and across which contract>
- **Data model / API contract:** <schemas and endpoint shapes, written out — not assumed>
- **State ownership:** <who owns each piece of state; where the source of truth lives>
- **Failure and fallback behavior:** <what happens when each boundary fails>

### Decisions, with the premise each rests on

A conclusion on its own cannot be re-checked later. State what expires it, so a scope change is
caught as an expiry rather than argued as a mistake. Re-read this table at every gate.

| # | Decision | Premise it rests on | Expires if | Status |
| --- | --- | --- | --- | --- |
| D1 | <what was decided> | <the one sentence that makes it correct> | <the change that would end that> | live |
| D2 | | | | live / **expired → superseded by D…** |

### House mechanics *(answer from the repo, not from convention)*

| Question | Answer | Evidence |
| --- | --- | --- |
| Schema changes applied how? | | <migrations dir present/absent; what prior changes did> |
| Test / lint / typecheck / build commands | | <package manifest scripts> |
| What CI runs, on which events | | <workflow file> |
| Ignore patterns that could swallow state | | <ignore file> |
| What a commit on this branch triggers | | <branch protection, deploy config> |
| Branching the repo already uses, and whether long-lived branches are allowed | | <existing branch names; protection rules> |

### Phase plan *(Stage 2 — cut these before the feature list)*

One phase, one branch. Each row's **demonstrable** is what a person will be walked through at the
merge — write it before any of the phase's features are specified. Mirrored into
`feature-list.json`; this table is the readable version.

| # | Phase | Branch | Demonstrable at merge | Premise these features share | Status |
| --- | --- | --- | --- | --- | --- |
| P1 | <slug> | `phase/1-<slug>` | <what you can show> | <the shared assumption> | in_progress |
| P2 | <slug> | `phase/2-<slug>` | | | planned |

**Sub-branches below a phase** — each needs a reason at the moment it is cut, recorded in
`progress.md`, not here:

| Branch | Cut from | Reason it exists rather than a commit on the phase branch |
| --- | --- | --- |
| | | |

## 7. Logic flow  *(Stage 2)*

Happy path first, then every branch. A numbered list is enough; it only has to exist before the code does.

1.

## 8. UI  *(Stage 2, if user-facing)*

<Wireframe, ASCII sketch, or written description of each screen and state — including empty, loading, and error states.>

## 9. Non-functional  *(Stage 2)*

- **Performance:** <targets, stated as numbers>
- **Security:** <authn/authz model, trust boundaries, data sensitivity>
- **Accessibility:** <target level>
- **Testing:** <what "tested" means for this build>

---

## 10. Deployment  *(Stage 6, drafted early)*

- **Environments:**
- **Rollback plan:** <the exact steps, decided now rather than at 2am>
- **Smoke test after deploy:**
- **Who watches the release window:**

---

## Changelog

Scope changes go here with a date and a reason. An undocumented scope change is indistinguishable from drift.

| Date | Change | Why |
| --- | --- | --- |
| | | |
