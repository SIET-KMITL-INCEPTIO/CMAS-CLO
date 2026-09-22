---
name: github-report
description: >-
  Turn GitHub activity — commits, pull requests, and issues — into a written report
  (.md) of completed work, grouped by sprint, feature, function, or section. Also
  defines the commit / PR / issue conventions that make such a report possible in the
  first place. Trigger on "summarize what we shipped", "write a sprint report",
  "release notes from the last two weeks", "what did the team complete this
  milestone", "report from GitHub commits and PRs", "set commit message rules",
  "PR template", "issue template". Not for reviewing code quality of a diff, and not
  for planning upcoming work.
license: MIT
metadata:
  author: tp-job (enhanced by Claude)
  version: "1.1.0"
  source: Github-report brief (compiled 2026)
---

# SKILL: GitHub Activity → Work Report

The problem this solves: *"I need to summarize completed work, and the input data is GitHub."*

A report is only as good as the records it is built from. So this skill has two halves, and the first one is not optional context — it is a prerequisite check:

1. **Conventions** — commits, PRs, and issues written so that scope, type, and linkage are machine-readable.
2. **Report** — collect that data for a window, group it, and write a `.md`.

If the repository's history does not follow conventions, say so up front and generate the report from what is actually there rather than inventing structure that isn't in the data.

---

## Step 0 — Check the ground truth

Before promising a report, sample the data:

```bash
git log --oneline -30
```

| What you see | What to do |
| --- | --- |
| Conventional-style subjects (`feat(auth): …`), issue refs, merge commits with PR numbers | Proceed to Step 1; grouping will be reliable |
| Free-form subjects, no refs, `wip` / `fix` / `update` noise | Proceed, but plan to group by file path and PR title instead of commit type, and warn the user the grouping is inferred |
| The user is asking to *set up* rules, not report | Skip to [Conventions](#conventions) and stop there |

Also confirm whether `gh` is available (`gh auth status`). Without it, PR and issue bodies are unreachable and the report is commit-only — state that limitation instead of silently dropping the PR/issue sections.

---

## Step 1 — Pin the scope

Do not start collecting until all four are fixed. Ask only for what cannot be inferred:

- **Window** — sprint dates, a milestone, a tag range (`v1.3.0..v1.4.0`), or "since last release".
- **Repo / branch** — which repo, and merged-into-what.
- **Grouping axis** — sprint, feature, function, or section. This is the report's spine; see [report-structure.md](references/report-structure.md).
- **Audience** — engineering, stakeholder, or release-notes. It changes the vocabulary, not the facts.

Convert relative windows to absolute dates immediately (`"last two weeks"` → `2026-07-23..2026-08-06`) and put those dates in the report header. A report whose range is ambiguous cannot be re-run.

---

## Step 2 — Collect

Run the recipes in [data-collection.md](references/data-collection.md) — exact `git log` and `gh` commands with the field sets worth pulling. Collect in this order, because each layer supplies the context the previous one lacks:

1. **Merged PRs** in the window → the unit of delivered work.
2. **Closed issues** in the window → the *why*, and the user-visible outcome.
3. **Commits** in the window → the detail, and the only source when PRs are thin.

Keep the raw pull in the scratchpad. Never quote a number (PR count, issue count) that you did not read out of a command's output.

---

## Step 3 — Group and classify

Assign every collected item to exactly one group on the chosen axis, then classify it by type (feature / fix / refactor / docs / chore / infra).

Resolution order when signals disagree — use the first that is present:

1. Explicit issue label or milestone
2. Conventional-commit scope (`feat(billing):` → billing)
3. PR title / linked issue title
4. Dominant file path of the diff (`src/payments/**` → payments)

Anything that resists all four goes in an **Other** group. Do not force it — a small honest Other section is better than a mislabeled feature.

Drop from the report: merge commits with no content, revert pairs that cancel out, and pure lockfile or formatting churn. Note the count of what you dropped so the totals reconcile.

---

## Step 4 — Write the report

Start from [sprint-report.md](assets/sprint-report.md) and follow the section rules in [report-structure.md](references/report-structure.md).

Non-negotiables:

- **Every claim carries a reference** — `#123`, `PR #456`, or a short SHA. A line no one can trace is a line no one can verify.
- **Outcome, not activity.** BAD: "Modified `AuthService.ts` and 4 other files." BETTER: "Sessions now survive a server restart (#412)."
- **Say what did not land.** Carried-over and reverted work is the part of a sprint report people actually act on.
- **No invented metrics.** If velocity, coverage, or cycle time were not measured, leave them out rather than estimating.

Write to `reports/<YYYY-MM-DD>-<scope>.md` unless the user names a path.

---

## Step 5 — Reconcile before delivering

- Item counts in the summary equal the counts in the sections.
- Every PR/issue number in the report appeared in the Step 2 output.
- The date range in the header matches the range actually queried.
- Anything ambiguous is marked as inferred, not asserted.

---

## Conventions

Define these once, per repo, and the report becomes mechanical. Introduce them for new work only — do not rewrite history to match.

| Need | Read |
| --- | --- |
| Commit message format, scopes, issue refs | [commit-conventions.md](references/commit-conventions.md) |
| PR title, body template, linking keywords, merge strategy | [pr-conventions.md](references/pr-conventions.md) |
| Issue types, labels, milestones, acceptance criteria | [issue-conventions.md](references/issue-conventions.md) |

## Reference map

| Need | Read |
| --- | --- |
| Exact commands to pull commits, PRs, issues | [data-collection.md](references/data-collection.md) |
| Section-by-section report anatomy, per audience | [report-structure.md](references/report-structure.md) |
| A blank report to fill in | [sprint-report.md](assets/sprint-report.md) |

---

**Where this fits:** this skill is upstream of itself — the conventions in the first half of this file are what make the report in the second half possible, so the output shape is a decision to make *before* the build that produces the commits, not after it.

These are copies, not forks. Refresh them from the skill library rather than editing them in place; the only thing that differs from the originals is the depth of their relative links.
