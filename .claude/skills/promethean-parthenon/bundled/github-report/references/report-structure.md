# Report Structure

## Choosing the grouping axis

| Axis | Group by | Use when |
| --- | --- | --- |
| **Sprint** | Milestone or date window | Recurring team ritual; the reader tracks commitment vs. delivery |
| **Feature** | Epic, or `area:` label | The reader cares about one product capability across several sprints |
| **Function** | Layer or subsystem (API, UI, data, infra) | Handoff or onboarding; the reader is looking for where code changed |
| **Section** | Module or directory | Large monorepo where "who owns this" is the first question |

Pick exactly one. A report grouped two ways at once double-counts, and the totals will not reconcile.

## Section anatomy

Ordered by what a reader looks for first. Omit any section that is empty rather than writing "None" five times.

| Section | Contents | Omit when |
| --- | --- | --- |
| **Header** | Scope, absolute date range, repo, branch, generated-on date | Never |
| **Summary** | 3–5 sentences: what shipped, what slipped, what to know | Never |
| **At a glance** | PRs merged, issues closed, contributors — counts only, straight from Step 2 output | Counts weren't collected |
| **Breaking changes** | Anything marked `!` or `BREAKING CHANGE:`, with the migration | Nothing broke |
| **Delivered** | The grouped body — one subsection per group | Never |
| **Fixes** | Bug fixes, unless already folded into groups | Grouping already covers them |
| **Internal** | Refactors, infra, tooling, docs | Audience is stakeholder or release-notes |
| **Not landed** | Carried over, reverted, closed as not-planned — with the reason | Genuinely nothing |
| **Caveats** | Data gaps, inferred groupings, unlinked issues | Never — say "none" here if so |

## Writing a bullet

```markdown
- **Prorated mid-cycle upgrades** — upgrading mid-period now credits the unused
  remainder before charging the new plan. ([#412](…), [PR #438](…))
```

The shape is: **bolded outcome** — one sentence of what changed for whom — references.

| Rule | BAD | BETTER |
| --- | --- | --- |
| Outcome over activity | Refactored `BillingService` and updated 6 tests | Upgrades no longer double-charge on the first invoice |
| User's vocabulary | Added `prorate_on_upgrade` flag to `SubscriptionDTO` | Mid-cycle upgrades are now prorated |
| One bullet, one change | Fixed proration, added CSV export, bumped Stripe SDK | Three bullets |
| Always cite | Improved checkout reliability | Improved checkout reliability (PR #438) |

## Audience adjustments

The facts do not change; the altitude and vocabulary do.

| Audience | Lead with | Include | Drop |
| --- | --- | --- | --- |
| **Engineering** | What changed in the system | Internal section, file/module names, migration notes | Nothing |
| **Stakeholder** | Business outcome and status vs. commitment | Not-landed section with reasons, risks | Internal section, SHAs |
| **Release notes** | What users can now do | Upgrade instructions, breaking changes | Internal work, contributor names, process metrics |

## Metrics

Report only what was measured. Counts of PRs, issues, and contributors come free from Step 2 and are safe. Cycle time is defensible if pulled per [data-collection.md](data-collection.md).

Do not report velocity, story points, coverage, or "productivity" unless the user supplies the numbers — GitHub does not know them, and an estimate presented in a report reads as a measurement.

Never rank individuals by commit or line count. It measures nothing about contribution and reliably distorts behavior once people know it is being reported.

## Length

A sprint report that runs past two screens stops being read. If the Delivered section exceeds ~20 bullets, the grouping is too fine — roll up a level and let the references carry the detail.
