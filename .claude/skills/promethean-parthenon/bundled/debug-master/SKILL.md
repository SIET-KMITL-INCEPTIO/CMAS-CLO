---
name: debug-master
description: >-
  Deep debug and auto-fix skill covering file system inspection, logic tracing, algorithm analysis, and AI workflow debugging. Trigger this skill whenever the user shares an error message, stack trace, broken file path, missing module, wrong output, or describes unexpected behavior in any codebase or workflow. Also trigger for: "why is this not working", "fix this bug", "check my paths", "trace this logic", "analyze this algorithm", "my workflow is broken", "find the error", "debug this agent", "check folder structure", "validate these files", "summarize this algorithm's complexity", or any variant of these. Use this skill even for vague reports like "something is wrong" — the skill's intake phase will extract what's needed. Covers Python, JavaScript/TypeScript, Go, Bash, SQL, LangChain/LangGraph, AutoGen, CrewAI, and generic AI agent workflows. This skill is intentionally broad — when in doubt, use it.
argument-hint: "<error, path, file, or workflow to debug>"
license: MIT
metadata:
  author: tp-job (enhanced by Claude)
  version: "1.0.0"
  source: Multi-layer debugging methodology (compiled 2026)
---

# debug-master

> Senior-level debugging across **File System**, **Logic & Workflow**, and **Algorithm Analysis**. Four phases: Inspect → Isolate → Diagnose → Fix.

---

## Overview

This skill runs a structured, multi-layer debug session. It covers three orthogonal problem classes — file/path issues, logic/workflow failures, and algorithm bugs — then converges on a minimal, verified fix.

```
┌──────────────────────────────────────────────────────────────────────┐
│                        DEBUG-MASTER PIPELINE                         │
├──────────────────┬──────────────────┬──────────────────┬────────────┤
│  PHASE 1         │  PHASE 2         │  PHASE 3         │  PHASE 4   │
│  FILE SYSTEM     │  LOGIC &         │  ALGORITHM       │  FIX &     │
│  INSPECTION      │  WORKFLOW TRACE  │  ANALYSIS        │  VERIFY    │
│                  │                  │                  │            │
│  • Path exists?  │  • Entry point   │  • Complexity    │  • Patch   │
│  • Type correct? │  • Step order    │  • Edge cases    │  • Test    │
│  • Folder tree   │  • State flow    │  • Correctness   │  • Guard   │
│  • Permissions   │  • Long chain    │  • Summary       │  • Docs    │
└──────────────────┴──────────────────┴──────────────────┴────────────┘
```

Start at the phase that matches the reported problem. Many bugs span multiple phases — run all relevant phases before proposing a fix.

---

## PHASE 1 — File System Inspection

Run this phase when the error involves a path, import, missing file, wrong type, permission denied, module not found, or directory mismatch.

### 1-A Path Validation Checklist

For every path mentioned in the error or provided by the user:

|Check|Tool / Command|What to look for|
|---|---|---|
|**Exists**|`os.path.exists()` / `ls` / `stat`|FileNotFoundError, None|
|**Type**|`os.path.isfile()` / `os.path.isdir()`|Confusion between dir and file|
|**Extension**|`pathlib.Path.suffix` / `file -b`|`.py` vs `.txt`, missing ext|
|**Absolute vs relative**|`os.path.abspath()`|CWD assumption bug|
|**Symlink**|`os.path.islink()` / `readlink`|Dangling symlinks|
|**Permissions**|`os.access(R_OK/W_OK/X_OK)`|PermissionError|
|**Encoding**|`chardet` / `file -i`|UTF-8 vs Latin-1|

**Diagnostic template (Python):**

```python
import os, pathlib, stat

def inspect_path(p: str) -> dict:
    path = pathlib.Path(p)
    return {
        "raw":        str(path),
        "absolute":   str(path.resolve()),
        "exists":     path.exists(),
        "is_file":    path.is_file(),
        "is_dir":     path.is_dir(),
        "is_symlink": path.is_symlink(),
        "suffix":     path.suffix,
        "size_bytes": path.stat().st_size if path.exists() else None,
        "permissions": oct(path.stat().st_mode) if path.exists() else None,
    }
```

**Diagnostic template (Bash):**

```bash
p="$1"
echo "--- Path Inspection: $p ---"
[ -e "$p" ]  && echo "EXISTS"    || echo "MISSING"
[ -f "$p" ]  && echo "FILE"      || true
[ -d "$p" ]  && echo "DIR"       || true
[ -L "$p" ]  && echo "SYMLINK → $(readlink -f $p)" || true
[ -r "$p" ]  && echo "READABLE"  || echo "NOT READABLE"
[ -w "$p" ]  && echo "WRITABLE"  || echo "NOT WRITABLE"
[ -x "$p" ]  && echo "EXECABLE"  || echo "NOT EXECABLE"
ls -la "$p" 2>/dev/null || true
file "$p"    2>/dev/null || true
```

### 1-B Folder Structure Scan

When the error is "module not found", "file missing", or "wrong directory":

```bash
# Print full tree (depth 3), sizes, hidden files
find . -maxdepth 3 -not -path '*/\.*' | sort | \
  awk '{depth=split($0,a,"/"); printf "%*s%s\n", depth*2,"", a[depth]}'
```

Map what the code **expects** vs what **actually exists**:

```
Expected layout (from imports/config)     Actual layout (from scan)
──────────────────────────────────        ──────────────────────────
src/
  utils/
    helpers.py          ◄────── MISSING   src/util/helper.py  ← wrong name
  agents/
    coordinator.py      ◄────── OK        agents/coordinator.py
config/
  settings.yaml         ◄────── MISSING   (not found anywhere)
```

Common mismatches to flag:

- Singular vs plural (`util/` vs `utils/`)
- Case sensitivity (`Helper.py` vs `helper.py`)
- Nested vs flat (`agents/coordinator.py` vs `coordinator.py`)
- Wrong working directory at runtime

### 1-C File Content Quick-Check

When the file exists but behaves wrong:

```python
# Detect encoding issues, empty files, truncated content
with open(path, "rb") as f:
    raw = f.read(512)

print(f"First 512 bytes (hex): {raw.hex()}")
print(f"BOM detected: {raw.startswith((b'\xef\xbb\xbf', b'\xff\xfe', b'\xfe\xff'))}")
print(f"File size: {os.path.getsize(path)} bytes")
print(f"Line count: {sum(1 for _ in open(path))}")
```

For config files (YAML/JSON/TOML/env):

```python
# Validate parse-ability
import json, yaml, tomllib

try:
    with open(path) as f:
        data = json.load(f)   # or yaml.safe_load / tomllib.load
    print("Parses OK:", data)
except Exception as e:
    print(f"PARSE ERROR at {e}")
```

### 1-D Dependency & Import Trace

When the error is `ImportError`, `ModuleNotFoundError`, or missing package:

```bash
# Which Python is running?
which python3 && python3 --version

# Is the package installed in THIS env?
pip show <package-name>
pip list | grep -i <package-name>

# Is __init__.py present where expected?
find . -name "__init__.py" | sort

# Check sys.path at runtime
python3 -c "import sys; [print(p) for p in sys.path]"
```

For Node.js:

```bash
node -e "console.log(require.resolve('<module>'))"
ls node_modules/<module>/package.json
cat package.json | jq '.dependencies, .devDependencies'
```

---

## PHASE 2 — Logic & Workflow Trace

Run this phase for: wrong output, silent failures, incorrect state, off-by-one errors, race conditions, agent loops, broken pipelines, and any "it runs but does the wrong thing" scenario.

### 2-A Locate the Entry Point

Identify where execution begins and trace forward:

```
1. Find main() / __main__ / handler / run() / start()
2. Mark the FIRST observable deviation from expected behavior
3. Everything before that point is TRUSTED; focus after it
```

Ask (or infer from context):

- What is the **first output** the user actually sees?
- At what **step** does it diverge from expectation?
- What **data shape** enters the buggy function?

### 2-B Long Workflow Decomposition

For workflows with 5+ steps, pipelines, DAGs, or agent chains:

```
Step  │ Name             │ Input Shape      │ Output Shape     │ Status
──────┼──────────────────┼──────────────────┼──────────────────┼────────
  1   │ load_data()      │ path: str        │ df: DataFrame    │  ✓ OK
  2   │ preprocess()     │ df: DataFrame    │ df: DataFrame    │  ✓ OK
  3   │ split_chunks()   │ df: DataFrame    │ chunks: list     │  ? UNK
  4   │ embed()          │ chunks: list     │ vectors: ndarray │  ✗ FAIL ← bug here
  5   │ index_store()    │ vectors: ndarray │ index: FAISS     │  – SKIP
```

**Rules for tracing long chains:**

- Add a `print(f"[STEP N] type={type(x)}, shape={getattr(x,'shape',len(x))}")` after each step
- Never assume a step succeeded without logging its output type and size
- For async workflows: log timestamps; a 0ms step likely short-circuited
- For agent loops: log every tool call and its return value

**State mutation audit** (for OOP or stateful pipelines):

```python
# Snapshot state before and after each method call
import copy

state_before = copy.deepcopy(obj.__dict__)
obj.some_method()
state_after = obj.__dict__

diff = {k: (state_before.get(k), state_after.get(k))
        for k in set(state_before) | set(state_after)
        if state_before.get(k) != state_after.get(k)}
print("State mutations:", diff)
```

### 2-C AI Agent / LLM Workflow Debugging

For LangChain, LangGraph, AutoGen, CrewAI, custom agent loops:

```
Agent Debug Checklist:
┌─────────────────────────────────────────────────────────────┐
│ PROMPT LAYER                                                │
│  □ Is the system prompt reaching the model unchanged?      │
│  □ Is context window being exceeded? (count tokens)        │
│  □ Is the model receiving the right tool definitions?      │
│                                                             │
│ TOOL / FUNCTION LAYER                                       │
│  □ Does tool schema match the actual function signature?   │
│  □ Is the tool returning the expected type/format?         │
│  □ Are tool errors being caught and re-fed to the model?   │
│                                                             │
│ STATE / MEMORY LAYER                                        │
│  □ Is conversation history being truncated too early?      │
│  □ Is memory being written/read from the right key/index?  │
│  □ Is shared state thread-safe (for parallel agents)?      │
│                                                             │
│ LOOP / ORCHESTRATION LAYER                                  │
│  □ Is the termination condition ever True?                  │
│  □ Is the router sending to the right node/agent?          │
│  □ Are intermediate steps being logged?                    │
└─────────────────────────────────────────────────────────────┘
```

**Minimal agent trace shim (LangChain):**

```python
from langchain.callbacks.base import BaseCallbackHandler

class DebugCallback(BaseCallbackHandler):
    def on_llm_start(self, serialized, prompts, **kw):
        print(f"\n[LLM START] tokens≈{sum(len(p)//4 for p in prompts)}")
        print(f"  Prompt preview: {prompts[0][:200]}...")

    def on_tool_start(self, serialized, input_str, **kw):
        print(f"\n[TOOL] {serialized['name']} ← {input_str[:100]}")

    def on_tool_end(self, output, **kw):
        print(f"[TOOL] → {str(output)[:200]}")

    def on_llm_error(self, error, **kw):
        print(f"[LLM ERROR] {error}")
```

### 2-D Conditional & Branch Logic Audit

For bugs that appear "sometimes" or "only with certain inputs":

```python
# Instrument every branch
def debug_branch(condition_name: str, value: bool, context: dict = None):
    print(f"[BRANCH] {condition_name} = {value}  context={context}")
    return value

# Usage:
if debug_branch("user_is_admin", user.role == "admin", {"user_id": user.id}):
    ...
elif debug_branch("user_is_editor", user.role == "editor"):
    ...
else:
    debug_branch("fallback", True)
```

For SQL / data pipelines — check NULLs, empty sets, type coercion:

```sql
-- Before the query that fails:
SELECT COUNT(*), COUNT(column_name), COUNT(DISTINCT column_name)
FROM   table_name
WHERE  your_filter_condition;
-- If COUNT(*) >> COUNT(column_name): NULLs are causing the bug
```

---

## PHASE 3 — Algorithm Analysis & Summary

Run this phase when the user shares a function, class, or module and asks why it's slow, incorrect, or hard to understand.

### 3-A Complexity Analysis

Analyze every loop, recursion, and nested call:

```
COMPLEXITY REPORT TEMPLATE
──────────────────────────
Function: <name>
Lines:    <N>

Time Complexity:
  Best case:    O(?)  ← when / why
  Average case: O(?)
  Worst case:   O(?)  ← when / why (focus here)

Space Complexity:
  O(?)  ← what grows: stack, heap, accumulator?

Dominant term: <the loop/call that drives complexity>
Hidden costs:
  • <e.g., dict lookup inside inner loop looks O(1) but worst-case O(n) with collision>
  • <e.g., string concatenation in loop: O(n²) due to immutability>
  • <e.g., list.index() inside loop: O(n²) total>
```

### 3-B Correctness Audit

Walk through the algorithm with **three canonical inputs**:

|Input Class|Example|Expected Output|Actual Output|Pass?|
|---|---|---|---|---|
|Happy path|normal input|expected|actual|✓/✗|
|Edge: empty / zero|`[]`, `0`, `""`|expected|actual|✓/✗|
|Edge: large / overflow|`10^9`, `sys.maxsize`|expected|actual|✓/✗|

Common algorithm bugs to check:

- **Off-by-one**: loop range `< n` vs `<= n`, index `i` vs `i+1`
- **Integer overflow**: use `//` for floor division, check `sys.maxsize`
- **Float precision**: never use `==` on floats; use `math.isclose()`
- **Mutable defaults**: `def fn(lst=[])` — classic Python footgun
- **Early return / break missing**: loop that should exit doesn't
- **Greedy vs optimal**: greedy choice not globally optimal
- **Base case missing**: recursion without a halt condition

### 3-C Algorithm Summary Block

After analysis, produce this concise block for the user:

```
╔══════════════════════════════════════════════════════════════╗
║  ALGORITHM SUMMARY: <function_name>                          ║
╠══════════════════════════════════════════════════════════════╣
║  Purpose:     <one sentence>                                 ║
║  Approach:    <paradigm: greedy / DP / BFS / divide&conquer> ║
║  Input:       <type, constraints>                            ║
║  Output:      <type>                                         ║
║  Time:        O(?)  — <why>                                  ║
║  Space:       O(?)  — <why>                                  ║
║  Correctness: ✓ / ✗ — <note any known bug>                  ║
║  Optimizable: YES/NO — <what and how>                        ║
╚══════════════════════════════════════════════════════════════╝
```

### 3-D Optimization Recommendation

Only suggest an optimization when it materially changes complexity:

```
Current:  O(n²)  — nested list search
Fix:      O(n)   — replace inner list with set() lookup
Tradeoff: +O(n) space; justified when n > ~1000

Current:  O(n log n)  — sort then binary search, called k times
Fix:      O(n + k)    — precompute sorted index once, reuse
Tradeoff: minimal; always do this if k > 1
```

---

## PHASE 4 — Fix & Verify

### 4-A Root Cause Statement

Write one sentence in this form before proposing code:

> **Root cause:** `[specific function/line]` [does X] but [should do Y] because [reason]. First visible symptom: [error/output].

This forces precision and prevents fixing the symptom instead of the cause.

### 4-B Minimal Patch

Show only the changed lines with clear before/after:

```diff
# File: src/agents/coordinator.py  Line: 47
- result = self.tools[tool_name](input)
+ result = self.tools.get(tool_name)
+ if result is None:
+     raise KeyError(f"Tool '{tool_name}' not registered. "
+                    f"Available: {list(self.tools.keys())}")
+ result = result(input)
```

### 4-C Regression Guard

Provide the minimal test that would have caught this bug:

```python
def test_<bug_name>():
    """Regression: <one-line description of what failed>"""
    # Arrange
    ...
    # Act
    with pytest.raises(KeyError, match="Tool 'X' not registered"):
        coordinator.run(tool_name="X")
    # Assert
    # (assertion is in the raises block above)
```

### 4-D Post-Fix Checklist

```
□ Does the fix address the ROOT CAUSE (not just the symptom)?
□ Does the fix break any other callers of this function?
□ Are all edge cases still handled?
□ Is the fix backward-compatible?
□ Is a migration / data fix needed (DB, files, cached state)?
□ Should a feature flag wrap this change?
□ Is there a log/metric to confirm the fix is live?
```

---

## Output: Debug Report Template

```markdown
## Debug Report: [Issue Summary]

### Classification
- **Type**: [ ] File/Path  [ ] Logic/Workflow  [ ] Algorithm  [ ] Multi-phase
- **Severity**: Critical / High / Medium / Low
- **Scope**: [function / module / service / system]

### Reproduction
- **Expected**: [what should happen]
- **Actual**: [what happens instead]
- **Reproduces consistently?**: Yes / Flaky (conditions: ...)

### Findings

#### Phase 1 — File System
[Path validation results, missing files, type mismatches, tree diffs]

#### Phase 2 — Logic & Workflow
[Workflow step table, first deviation, state audit, agent trace]

#### Phase 3 — Algorithm
[Complexity report, correctness table, algorithm summary block]

### Root Cause
[One sentence root cause statement from 4-A]

### Fix
[Diff from 4-B]

### Regression Test
[Code from 4-C]

### Prevention
[Checklist items from 4-D, plus any architectural suggestions]
```

---

## Decision Tree — Which Phase(s) to Run

```
User reports a bug
        │
        ▼
"File not found / import error / wrong path / missing module?"
   YES ──► Run PHASE 1 (File System Inspection)
   NO  ──► continue
        │
        ▼
"Wrong output / silent failure / agent loop / pipeline broken?"
   YES ──► Run PHASE 2 (Logic & Workflow Trace)
   NO  ──► continue
        │
        ▼
"Slow / incorrect result / want to understand algorithm?"
   YES ──► Run PHASE 3 (Algorithm Analysis)
        │
        ▼
All relevant phases complete → Run PHASE 4 (Fix & Verify)
```

**When in doubt, run all phases.** A file bug often masks a logic bug.

---

## Quick Reference — Common Error Patterns

| Error                    | Most Likely Phase | First Check                    |
| ------------------------ | ----------------- | ------------------------------ |
| `FileNotFoundError`      | Phase 1           | `os.path.abspath(path)` vs CWD |
| `ModuleNotFoundError`    | Phase 1           | `pip show` + `sys.path`        |
| `KeyError` in dict       | Phase 2           | Log `.keys()` before access    |
| `IndexError` in list     | Phase 2 + Phase 3 | Off-by-one audit               |
| `NoneType has no attr`   | Phase 2           | Find where `None` enters       |
| Wrong LLM output         | Phase 2           | Log full prompt + token count  |
| Agent infinite loop      | Phase 2           | Check termination condition    |
| TLE / timeout            | Phase 3           | Complexity audit               |
| Wrong math result        | Phase 3           | Float precision + off-by-one   |
| Flaky / race condition   | Phase 2           | Add timestamps + thread IDs    |
| "Works locally not prod" | Phase 1 + 2       | Env vars, paths, versions      |

---

## Notes for AI Workflow Architects

When debugging **multi-agent systems** or **prompt pipelines**, treat each agent/prompt as a black box with a defined input schema and output contract. Debug the **contract boundary**, not the internals first:

1. **Log the exact string** sent to each model — not a template, the rendered string.
2. **Log the exact response** — not a parsed version, the raw API response.
3. **Validate schemas** at every hand-off (use Pydantic / Zod / JSON Schema).
4. **Isolate agents** — run each agent in isolation with synthetic inputs before debugging the composed system.
5. **Replay failure cases** — save the exact input that caused the failure and replay it deterministically (fix seed, temperature=0) to reproduce.