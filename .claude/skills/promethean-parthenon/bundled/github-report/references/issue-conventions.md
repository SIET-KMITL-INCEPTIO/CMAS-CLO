# Issue Conventions

Issues carry the *why* and the *for whom*. Commits and PRs carry the *what* and *how*. A report built only from commits can describe activity but not value — that gap is exactly what issue conventions close.

## Title

```
<Area>: <outcome the user gets, or the problem they hit>
```

BAD: `Bug in checkout`
BETTER: `Checkout: card declined message shows for successful 3DS payments`

## Types

One type per issue. This becomes the report's section assignment.

| Type label | Means | Closes when |
| --- | --- | --- |
| `type:feature` | New capability | Users can do the new thing in production |
| `type:bug` | Behavior deviates from expectation | The wrong behavior is gone and covered by a test |
| `type:chore` | Maintenance, dependency, cleanup | The task is done |
| `type:spike` | Time-boxed investigation | A written finding exists, not code |
| `type:epic` | Container for related issues | All children are closed |

## Labels beyond type

- **Area** — `area:billing`, `area:auth`. Same vocabulary as the commit scope. This is what makes cross-source grouping possible.
- **Priority** — `p0` … `p3`. Used to order sections in the report, not to describe the work.
- **Status** — `status:blocked`, `status:needs-info`. Only for states that stop work; anything else belongs in the project board, not a label.

Resist a large label taxonomy. Every label nobody applies consistently is a grouping signal that silently degrades.

## Bug template

`.github/ISSUE_TEMPLATE/bug.md`:

```markdown
## Expected
## Actual
## Steps to reproduce
1.
## Environment
<!-- version / browser / OS / account type -->
## Evidence
<!-- log excerpt, screenshot, request id -->
```

## Feature template

`.github/ISSUE_TEMPLATE/feature.md`:

```markdown
## Problem
<!-- Who is blocked, and what does it cost them today? Not the solution. -->

## Proposed outcome
<!-- What is true once this ships. -->

## Acceptance criteria
- [ ]
- [ ]

## Out of scope
```

The **Proposed outcome** line is what the report quotes. Write it as a completed state — "Admins can export invoices as CSV" — so it can be lifted verbatim once the issue closes.

## Milestones

One milestone per sprint or release, named for the thing, not the date range: `Sprint 24`, `v1.4.0`. Attach both the issue and the PR. A milestone is the cleanest possible report scope — `--milestone "Sprint 24"` beats any date arithmetic, because it survives work that slipped across the boundary.

## Closing hygiene

- Close via a PR keyword (`Closes #412`), not by hand. A manual close leaves no link to the work, and the report cannot cite anything.
- Closing as **not planned** (`state_reason: not_planned`) is distinct from completed. Reports must exclude these — collect the reason field and filter on it, or the sprint looks more productive than it was.
- An issue closed with no linked PR is a red flag worth surfacing in the report's caveats, not a silent inclusion.
