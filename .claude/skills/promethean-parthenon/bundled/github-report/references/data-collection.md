# Data Collection

Commands assume **GitHub CLI ≥ 2.40** (`gh --version`) authenticated for the repo (`gh auth status`), and **Git ≥ 2.30**. Run them from inside the repo, or add `--repo <owner>/<name>`.

Set the window once and reuse it:

```bash
SINCE=2026-07-23
UNTIL=2026-08-06
```

On PowerShell: `$SINCE = "2026-07-23"` and `$env:` is not needed — reference as `$SINCE`.

---

## 1. Merged PRs — the delivery log

```bash
gh pr list --state merged --limit 200 --search "merged:$SINCE..$UNTIL base:main" --json number,title,author,mergedAt,labels,url,body
```

Notes that matter:

- `--search` runs against GitHub's search API and **caps at 1000 results**; `--limit` caps what is returned. If the count equals your limit, the window is truncated — split it and re-run.
- `merged:A..B` is inclusive of both endpoints, in UTC. A sprint that ends "Friday evening local" needs the next day as `UNTIL`.
- `base:main` matters. Without it, PRs merged into feature branches inflate the report.

Linked issues, when you need the *why* per PR:

```bash
gh pr view <number> --json number,title,closingIssuesReferences
```

`closingIssuesReferences` is populated only by closing keywords (`Closes #123`), not by `Refs #123`.

---

## 2. Closed issues — the outcomes

```bash
gh issue list --state closed --limit 200 --search "closed:$SINCE..$UNTIL" --json number,title,labels,closedAt,stateReason,url,body
```

Filter out `stateReason == "NOT_PLANNED"` — those were abandoned, not delivered. Report them, if at all, in a separate line.

By milestone instead of dates — preferable when one exists, since it survives work that slipped:

```bash
gh issue list --state closed --milestone "Sprint 24" --limit 200 --json number,title,labels,stateReason,url
```

---

## 3. Commits — the detail

Tab-separated so it parses cleanly:

```bash
git log --since="$SINCE" --until="$UNTIL" --first-parent main --no-merges --pretty=format:"%h%x09%an%x09%ad%x09%s" --date=short
```

- `--first-parent main` keeps the delivery log — one entry per merged PR — instead of every intra-branch commit.
- Drop `--no-merges` and drop `--first-parent` if the repo uses merge commits and you need the `#123` from the merge subject.

Between releases, which is more precise than dates:

```bash
git log v1.3.0..v1.4.0 --no-merges --pretty=format:"%h%x09%s"
```

Which areas moved, for path-based grouping when scopes are missing:

```bash
git log --since="$SINCE" --until="$UNTIL" --name-only --pretty=format: | grep -v '^$' | sort | uniq -c | sort -rn | head -30
```

Contributors in the window:

```bash
git shortlog -sn --since="$SINCE" --until="$UNTIL" --no-merges
```

---

## 4. Reviews and cycle time — only if asked

These are expensive and rarely change the narrative. Pull them only when the report is explicitly about process health:

```bash
gh pr list --state merged --limit 100 --search "merged:$SINCE..$UNTIL" --json number,createdAt,mergedAt,reviews,additions,deletions
```

Cycle time = `mergedAt - createdAt`. Report it as a median with a range, never as a bare mean — PR ages are long-tailed and the mean will be dominated by one stale PR.

---

## Without `gh`

Everything above degrades to commits only. Say so explicitly in the report's caveats: PR bodies and issue outcomes are unavailable, so bullets will describe changes rather than user-visible value.

The web fallback, if the user can paste results: GitHub search `is:pr is:merged merged:2026-07-23..2026-08-06 repo:owner/name`.

---

## Handling the raw pull

Write raw JSON to the scratchpad before analyzing — a second `gh` call against a moving repo can return different data, and a report built from two inconsistent pulls will not reconcile in Step 5.

```bash
gh pr list --state merged --limit 200 --search "merged:$SINCE..$UNTIL base:main" --json number,title,author,mergedAt,labels,url,body > prs.json
```
