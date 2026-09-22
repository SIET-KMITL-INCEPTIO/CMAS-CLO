# Pull Request Conventions

The PR is the unit of delivered work. In a report, one merged PR should map to one bullet — if it doesn't, the PR was too big.

## Title

Same grammar as a commit subject, because with squash-merge the PR title *becomes* the commit subject:

```
feat(billing): charge prorated amount on mid-cycle upgrade
```

If the repo squash-merges, the title is the only thing that survives into `main`. Treat it as the deliverable, not a label.

## Body template

Save as `.github/pull_request_template.md`:

```markdown
## What
<!-- One paragraph. The outcome, in the language of the user, not the codebase. -->

## Why
Closes #

## How
<!-- Only the parts a reviewer cannot infer from the diff: the approach taken,
     and the alternatives rejected. Skip if the diff speaks for itself. -->

## Testing
<!-- What you ran, and what a reviewer should run to disbelieve you. -->

## Risk / rollback
<!-- Migrations, feature flags, config changes. "None" is a valid answer. -->
```

The **What** paragraph is what gets lifted into the report. Write it for someone who has not read the diff.

## Linking keywords

In the PR body, on its own line:

| Keyword | Effect |
| --- | --- |
| `Closes #123`, `Fixes #123`, `Resolves #123` | Issue closes automatically on merge to the default branch |
| `Refs #123`, `Part of #123` | Cross-link only; issue stays open |

Only the closing keywords produce the `closingIssuesReferences` field that Step 2 queries. A PR with no issue link is a PR whose *why* is lost the moment the author forgets it.

## Size

| PR size | Consequence |
| --- | --- |
| < ~400 changed lines | Reviewable in one sitting; one clean report bullet |
| 400–1000 | Review quality drops sharply; split if the diff has more than one *What* |
| > 1000 | Effectively unreviewed; in a report it becomes an unexplainable blob |

Generated files, lockfiles, and vendored code do not count toward this — mark them in `.gitattributes` with `linguist-generated=true` so they collapse in the diff view.

## Labels

Label PRs with the same vocabulary as issues (see [issue-conventions.md](issue-conventions.md)) so a report can be assembled from either side. At minimum:

- One **type** label: `type:feature`, `type:fix`, `type:refactor`, `type:docs`, `type:infra`
- One **area** label matching the commit scope: `area:billing`, `area:auth`, …

## Merge strategy

Pick one per repo and hold to it — a mixed history makes commit-based collection unreliable.

| Strategy | Report impact |
| --- | --- |
| **Squash** (recommended) | One commit per PR; `git log` on `main` *is* the delivery log. Requires disciplined PR titles. |
| **Merge commit** | `main` has merge commits carrying `#123`; collect with `--merges` and read PR numbers from the subject. |
| **Rebase** | No PR marker survives on `main`; PR data must come from the API, never from `git log`. |

## Draft and stacked PRs

Drafts are excluded from reports — they are not delivered. For a stacked chain, only the PR merged into the default branch counts; the intermediate ones would double-count the same work.
