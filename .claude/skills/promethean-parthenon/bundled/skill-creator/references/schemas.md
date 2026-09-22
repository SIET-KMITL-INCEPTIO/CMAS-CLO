# Eval & Benchmark JSON Schemas

Reference for [skill-creator](../SKILL.md). Read this when writing `evals.json`, `eval_metadata.json`, `grading.json`, `timing.json`, or hand-generating `benchmark.json`.

**Field names are a contract.** The aggregation script and the benchmark viewer read these exact keys. Renaming a field — even to something clearer — breaks the viewer silently, producing an empty or misleading report rather than an error.

---

## Where each file lives

```
<skill-name>/
├── SKILL.md
└── evals/
    └── evals.json                     ← the test suite, source of truth

<skill-name>-workspace/                ← sibling to the skill directory
└── iteration-1/
    ├── benchmark.json                 ← aggregated, generated
    ├── benchmark.md                   ← human-readable, generated
    ├── eval-0-with_skill/
    │   ├── eval_metadata.json         ← per-run prompt + assertions
    │   ├── grading.json               ← per-run assertion results
    │   ├── timing.json                ← per-run tokens + duration
    │   └── output/                    ← whatever the run produced
    └── eval-0-baseline/
        └── ...
```

Create directories as you go, not upfront.

---

## `evals/evals.json`

The test suite. Written once during authoring, then extended with assertions.

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 0,
      "name": "descriptive-name-here",
      "prompt": "User's task prompt",
      "expected_output": "Description of expected result",
      "files": [],
      "assertions": [
        "Output includes a rollback step",
        "No hardcoded credentials appear in generated config"
      ]
    }
  ]
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `skill_name` | string | yes | Must match the `name:` in SKILL.md |
| `evals` | array | yes | One entry per test case |
| `evals[].id` | integer | yes | Zero-based; maps to the `eval-N-*` directory names |
| `evals[].name` | string | recommended | Kebab-case; shown in the viewer |
| `evals[].prompt` | string | yes | Verbatim user prompt — realistic phrasing, not spec language |
| `evals[].expected_output` | string | yes | Prose description; not machine-checked |
| `evals[].files` | array of paths | yes | Input files copied into the run directory; `[]` if none |
| `evals[].assertions` | array of strings | added later | Objectively verifiable claims; added after the first runs |

**On writing assertions:** each string should be checkable by reading the output, and should read clearly on its own in the viewer. `"Output includes a rollback step"` is good; `"Output is high quality"` is not — that belongs in qualitative review, not an assertion.

---

## `eval_metadata.json` (per run)

Written into each run directory so the run is self-describing.

```json
{
  "eval_id": 0,
  "eval_name": "descriptive-name-here",
  "prompt": "The user's task prompt",
  "assertions": [
    "Output includes a rollback step"
  ]
}
```

Assertions here must stay in sync with `evals/evals.json`. When you draft assertions during Step 2, update both.

---

## `grading.json` (per run)

Produced by the grader. **The `expectations` array must use exactly `text`, `passed`, and `evidence`** — not `name`/`met`/`details` or any other variant. The viewer depends on these names.

```json
{
  "eval_id": 0,
  "configuration": "with_skill",
  "expectations": [
    {
      "text": "Output includes a rollback step",
      "passed": true,
      "evidence": "Section 'Rollback' at line 42 gives the revert command."
    },
    {
      "text": "No hardcoded credentials appear in generated config",
      "passed": false,
      "evidence": "config.yaml line 8 contains api_key: sk-live-..."
    }
  ],
  "pass_rate": 0.5,
  "notes": "Optional free-text qualitative observations."
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `eval_id` | integer | yes | Matches `evals.json` |
| `configuration` | string | yes | `"with_skill"` or `"baseline"` |
| `expectations[].text` | string | yes | The assertion, verbatim from `evals.json` |
| `expectations[].passed` | boolean | yes | No third state — an ungradeable assertion is a badly written one |
| `expectations[].evidence` | string | yes | Cite where in the output. An empty evidence string on a pass is a red flag |
| `pass_rate` | number 0–1 | yes | `passed / total` for this run |
| `notes` | string | no | Qualitative observations that no assertion captures |

---

## `timing.json` (per run)

Captured from the task-completion notification. **This is the only opportunity to record it** — it is not persisted anywhere else. Write it as each notification arrives rather than batching.

```json
{
  "total_tokens": 84852,
  "duration_ms": 23332,
  "total_duration_seconds": 23.3
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `total_tokens` | integer | From the notification |
| `duration_ms` | integer | From the notification |
| `total_duration_seconds` | number | `duration_ms / 1000`, rounded to 1 decimal |

---

## `benchmark.json` (aggregated)

Normally generated:

```bash
python -m scripts.aggregate_benchmark <workspace>/iteration-N --skill-name <name>
```

Generate it by hand only if the script is unavailable. Configurations are ordered **with_skill before its baseline counterpart** — the viewer renders them in array order.

```json
{
  "skill_name": "example-skill",
  "iteration": 1,
  "generated": "2026-07-26T10:00:00Z",
  "configurations": [
    {
      "name": "with_skill",
      "runs": 3,
      "pass_rate": { "mean": 0.83, "stddev": 0.12 },
      "duration_seconds": { "mean": 23.3, "stddev": 4.1 },
      "total_tokens": { "mean": 84852, "stddev": 6210 }
    },
    {
      "name": "baseline",
      "runs": 3,
      "pass_rate": { "mean": 0.42, "stddev": 0.19 },
      "duration_seconds": { "mean": 18.7, "stddev": 3.3 },
      "total_tokens": { "mean": 61204, "stddev": 5100 }
    }
  ],
  "delta": {
    "pass_rate": 0.41,
    "duration_seconds": 4.6,
    "total_tokens": 23648
  },
  "per_assertion": [
    {
      "text": "Output includes a rollback step",
      "with_skill_pass_rate": 1.0,
      "baseline_pass_rate": 0.33
    }
  ]
}
```

`delta` is always **with_skill minus baseline**. A positive `pass_rate` delta means the skill helped; positive `duration_seconds` and `total_tokens` deltas mean it cost more — which is the trade-off the analyst pass exists to weigh.

`per_assertion` is what makes an assertion's usefulness visible. An assertion where both rates are 1.0 is non-discriminating: it passes with or without the skill and is measuring nothing. Either tighten it or drop it.

---

## Validation checklist

Before launching the viewer:

- [ ] Every run directory has all three of `eval_metadata.json`, `grading.json`, `timing.json`
- [ ] `grading.json` uses `text` / `passed` / `evidence` — not any synonym
- [ ] `eval_id` values are consistent across `evals.json`, `eval_metadata.json`, and `grading.json`
- [ ] Each `with_skill` run has a matching `baseline` run with the same `eval_id`
- [ ] Assertion text is identical between `evals.json` and every `grading.json` that references it
- [ ] `configurations` in `benchmark.json` lists each `with_skill` before its baseline
- [ ] Every `passed: true` has non-empty `evidence`

---

## Related

- [index](index.md) — skill authoring index
- [project-problem-solver](project-problem-solver.md) — turning recurring project problems into skills
