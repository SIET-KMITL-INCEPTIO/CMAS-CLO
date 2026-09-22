# Commit Conventions

Target: [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/). It is the format assumed by `semantic-release`, `changesets`, and most changelog generators — and it is what makes Step 3 grouping deterministic.

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

```
feat(billing): charge prorated amount on mid-cycle upgrade

Upgrades mid-cycle previously billed the full new-plan price. Now the
unused remainder of the current period is credited before charging.

Refs: #412
```

## Types

Pick from this closed set. A type outside it breaks tooling and lands the commit in **Other**.

| Type | Use for | Appears in report as |
| --- | --- | --- |
| `feat` | New user-visible capability | Features |
| `fix` | Bug fix | Fixes |
| `perf` | Performance improvement, no behavior change | Features (or its own section) |
| `refactor` | Restructuring, no behavior change | Internal |
| `docs` | Documentation only | Internal |
| `test` | Tests only | Internal |
| `build` | Build system, dependencies | Internal |
| `ci` | Pipeline config | Internal |
| `chore` | Everything else with no product impact | Dropped from stakeholder reports |
| `revert` | Reverts a prior commit | Reverted section |

## Scope

The scope is the report's grouping key — treat it as a controlled vocabulary, not free text. Write down the allowed scopes in the repo's `CONTRIBUTING.md` and reuse them exactly.

Derive scopes from product areas (`billing`, `auth`, `search`), not from directories, unless the directories already are the product areas. `feat(src):` is worthless for grouping.

Omit the scope only when a change genuinely spans everything: `chore: bump Node to 22`.

## Subject line

- Imperative mood, lowercase, no trailing period: `add retry to webhook delivery`.
- ≤ 72 characters.
- Describe the outcome, not the file touched.

BAD: `updated auth.ts and fixed some stuff`
BETTER: `fix(auth): refresh token before expiry instead of after 401`

## Breaking changes

Either marker works; use both if the change is severe:

```
feat(api)!: drop v1 response envelope

BREAKING CHANGE: clients reading `data.result` must read `result`.
```

Anything with `!` or `BREAKING CHANGE:` gets its own top section in the report, above Features.

## Linking to issues

Put the reference in the **footer**, never only in the subject:

- `Refs: #412` — related work, issue stays open.
- `Closes: #412` / `Fixes: #412` — GitHub auto-closes the issue when merged to the default branch.

One commit, one primary issue. If a commit closes three issues, it is three commits.

## What not to do

| Anti-pattern | Why it costs you at report time |
| --- | --- |
| `wip`, `fix`, `update`, `.` | No type, no scope, no outcome — unclassifiable |
| Squashing a week into one commit | The report loses all granularity below "big blob landed" |
| Rewriting history to fix messages after push | Breaks everyone's clones for cosmetic gain; fix the PR title instead |
| Mixing a refactor and a feature in one commit | Forces a wrong single classification |
