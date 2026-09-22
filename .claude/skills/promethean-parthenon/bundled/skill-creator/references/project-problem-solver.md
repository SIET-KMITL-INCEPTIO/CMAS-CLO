---
name: project-problem-solver
description: >
  A skill for diagnosing, debugging, and permanently solving problems that arise
  during project development — and automatically generating a reusable sub-skill
  from every fix so the same problem never needs to be solved twice.
  Trigger on: error messages, stack traces, broken builds, failing tests, unexpected
  behavior, "it's not working", "how do I fix", "debug this", "why is this failing",
  or any pasted log output. Also trigger when the user asks to capture a fix as a
  reusable skill, prevent a recurring bug, or build a library of project-specific
  debugging skills. Always use this skill before attempting to debug freehand.
---

# Project Problem Solver

A two-part skill:
1. **Debug & Fix** — structured diagnosis and resolution of any project problem.
2. **Skill Forge** — automatically crystallize every fix into a reusable sub-skill,
   so the same problem is solved in seconds next time.

---

## PART 1 — DEBUG & FIX

### Step 1 · Understand

Before touching code, extract the full picture.
Pull answers from context first — only ask what's missing.

| Question | Why it matters |
|---|---|
| What was *expected* to happen? | Defines the target |
| What *actually* happened? | Defines the gap |
| When did it start? | Narrows the cause window |
| What changed recently? | Highest-probability cause |
| Is it reproducible? | Determines strategy |
| What is the environment? | Rules out config/version drift |

> **Stack trace rule:** always find the **root error line** first.
> Ignore library frames above it. The root cause is almost always the last
> `Caused by:` entry, or the first frame that points to *your own* code.

---

### Step 2 · Reproduce & Isolate

Shrink the problem to the smallest failing case.

```bash
# Run only the failing test — fast feedback loop
pytest tests/test_module.py::test_broken -xvs          # Python
npm test -- --testNamePattern="broken function"         # Node.js
go test ./pkg/... -run TestBroken -v                    # Go
cargo test broken_function -- --nocapture               # Rust
```

**Isolation checklist:**
- [ ] Fails with minimal / hardcoded input?
- [ ] Fails without external services (mock them)?
- [ ] Fails on a fresh dependency install?

```bash
# Fresh install — Python
rm -rf .venv && python -m venv .venv && pip install -r requirements.txt

# Fresh install — Node.js
rm -rf node_modules && npm ci
```

---

### Step 3 · Diagnose

Pick the right path based on the signal.

#### 3A — Stack Trace / Exception

```python
# 1. Find the root line — read the variable just before the crash
print(f"[DEBUG] {variable=!r}  type={type(variable)}")

# 2. Narrow with assertions
assert value is not None, f"Expected non-None, got {value!r}"
assert isinstance(data, list), f"Expected list, got {type(data)}"
```

```javascript
// JavaScript equivalent
console.log("[DEBUG]", { variable, type: typeof variable, stack: new Error().stack });
```

```bash
# Bash — trace every command
set -euxo pipefail
```

#### 3B — Wrong Output (No Crash)

```bash
# Find the last commit where output was correct
git bisect start
git bisect bad                        # now is broken
git bisect good <last-good-sha>
git bisect run pytest tests/          # automate the verdict
git bisect reset
```

#### 3C — Performance / Hang

```bash
python -m cProfile -s cumtime script.py | head -30   # Python hotspots
node --prof script.js                                 # Node.js flame data
node --prof-process isolate-*.log | head -30
```

#### 3D — Environment / Dependency Mismatch

```bash
# Verify actual vs expected versions
python --version && pip show <pkg>
node --version  && npm list <pkg>

# Diff lockfile vs HEAD
git diff HEAD requirements.txt
git diff HEAD package-lock.json
```

---

### Step 4 · Fix

Apply the **smallest change** that targets the root cause.

**Fix checklist:**
- [ ] Change hits root cause, not a symptom.
- [ ] All existing tests still pass.
- [ ] A new test covers this exact case.
- [ ] No unrelated changes included.

```bash
# Full test suite — always run after fixing
pytest                 # Python
npm test               # Node.js
go test ./...          # Go
cargo test             # Rust
```

---

### Step 5 · Verify & Harden

```python
# Add a regression test that would have caught this bug
def test_<bug_name>_regression():
    # Arrange — reproduce the original broken input
    input_data = <minimal_failing_input>
    # Act
    result = function_under_test(input_data)
    # Assert — this is what should have happened all along
    assert result == <expected_output>
```

---

## PART 2 — SKILL FORGE

After every successful fix, **forge a sub-skill** from the solution.
This transforms one-off debugging into a permanent, reusable asset.

### When to Forge

Forge a sub-skill if **any** of these are true:
- The problem took more than 5 minutes to diagnose.
- The fix follows a repeatable pattern (install step, config change, code guard).
- The same or similar error has appeared before.
- The root cause is environment- or project-specific (not obvious from docs).

---

### How to Forge — Step by Step

#### A · Classify the Problem

Choose a category to name and scope the skill correctly:

| Category | Examples |
|---|---|
| `bug-fix` | logic error, off-by-one, null pointer |
| `env-setup` | version mismatch, missing env var, path issue |
| `dependency` | broken package, API change, lockfile drift |
| `config` | wrong setting, missing secret, port conflict |
| `performance` | slow query, memory leak, infinite loop |
| `build` | compile error, missing asset, broken pipeline |
| `test` | flaky test, missing fixture, wrong mock |

#### B · Write the Sub-Skill File

Save to: `skills/<category>-<short-name>/SKILL.md`

Use this exact template:

```markdown
---
name: <category>-<short-name>
description: >
  Fixes: <one sentence describing the exact error or symptom>.
  Trigger when the user sees: "<paste the exact error message or key phrase>",
  or reports <symptom in plain language>.
  Environment: <language / framework / OS if relevant>.
---

# <Human-readable title>

## Problem
<Describe the symptom exactly as the user would experience it.>
<Include the exact error message if there is one.>

## Root Cause
<One or two sentences explaining WHY this happens.>

## Fix

### Prerequisites
- <tool / permission / file needed, if any>

### Steps
```bash
# Step 1 — <what and why>
<command>

# Step 2 — <what and why>
<command>
```

### Code Change (if applicable)
**Before:**
```<lang>
<broken code>
```
**After:**
```<lang>
<fixed code>
```

## Verify
```bash
<command to confirm the fix worked>
```

## Prevention
<One sentence: how to stop this from ever happening again.>

## Tags
<category>, <language>, <framework>, <error-keyword>
```

#### C · Register the Sub-Skill

Add an entry to `skills/INDEX.md` (create it if it doesn't exist):

```markdown
| Skill name | Trigger phrase / error | File |
|---|---|---|
| `<name>` | `<error message or symptom>` | `skills/<name>/SKILL.md` |
```

This index lets any agent (or human) search for the right skill without reading every file.

---

### Forge Example — End to End

**Scenario:** `ModuleNotFoundError: No module named 'dotenv'` keeps appearing on
fresh clones because `python-dotenv` is missing from `requirements.txt`.

**Generated sub-skill** → saved as `skills/env-setup-dotenv-missing/SKILL.md`:

```markdown
---
name: env-setup-dotenv-missing
description: >
  Fixes ModuleNotFoundError: No module named 'dotenv' in Python projects.
  Trigger when the user sees "No module named 'dotenv'" or reports that
  environment variables are not loading. Works for any Python project using
  python-dotenv regardless of framework.
---

# Fix: ModuleNotFoundError — python-dotenv not installed

## Problem
Running the project raises:
  ModuleNotFoundError: No module named 'dotenv'

## Root Cause
`python-dotenv` is used in the code but was never added to `requirements.txt`,
so it is missing after a fresh clone and install.

## Fix

### Steps
```bash
# Install the package
pip install python-dotenv

# Pin it so fresh installs never break again
pip freeze | grep python-dotenv >> requirements.txt
```

## Verify
```bash
python -c "import dotenv; print('OK')"
```

## Prevention
Always run `pip freeze > requirements.txt` (or update pyproject.toml)
immediately after installing a new package.

## Tags
env-setup, python, dotenv, ModuleNotFoundError
```

---

## PART 3 — QUICK REFERENCE

```bash
# ── Python ──────────────────────────────────────────────
python -m pytest -x -v              # stop on first failure
python -m pdb script.py             # interactive debugger
python -m cProfile -s cumtime s.py  # profiler

# ── Node.js ─────────────────────────────────────────────
node --inspect-brk script.js        # pause at start, attach DevTools
npx ts-node --inspect script.ts

# ── Git ─────────────────────────────────────────────────
git log --oneline -10               # recent commits
git diff HEAD~1                     # what changed in last commit
git stash && <run> && git stash pop # test without latest changes
git bisect start / good / bad       # binary search for breaking commit

# ── General ─────────────────────────────────────────────
env | sort                          # all environment variables
curl -v http://localhost:8080/ping  # test HTTP endpoint
lsof -i :8080                       # what's on port 8080
docker logs <container> --tail 50   # container logs
```

---

## Decision Flow

```
Problem reported
      │
      ▼
 Understand ──► Reproduce ──► Diagnose ──► Fix ──► Verify
                                                      │
                                                      ▼
                                              Should I Forge?
                                           ┌──────────────────┐
                                           │ Took >5 min?     │
                                           │ Repeatable fix?  │──YES──► Forge Sub-Skill
                                           │ Seen before?     │         ► Register in INDEX
                                           └──────────────────┘
                                                    │ NO
                                                    ▼
                                             Done — move on
```

---

## One Rule

> **Never leave a bug behind without a skill.**
> Every fix that took effort becomes a skill. Every skill saves future effort.
