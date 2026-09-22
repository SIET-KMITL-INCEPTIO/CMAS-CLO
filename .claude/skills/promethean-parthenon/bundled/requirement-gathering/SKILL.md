---
name: requirement-gathering
description: >
  Autonomous requirement extraction and documentation for PERN/MERN full-stack projects
  with micro design standards. Immediately produces a complete Markdown requirements document
  WITHOUT asking follow-up questions. Trigger when: analyzing existing component/API/DB code,
  writing a spec or PRD, defining acceptance criteria, auditing DS token usage, documenting
  component API contracts, reviewing full-stack feature requirements, or performing gap analysis.
  Thai triggers: "วิเคราะห์ code", "เขียน spec", "ทำ requirements", "audit component",
  "เช็ค design system", "สร้าง acceptance criteria", "document API contract".
  ALWAYS run autonomously — infer missing context, annotate assumptions, never ask to proceed.
  This is the "extract" half of writing a target: use it when the requirements already live in
  code, and agentic-engineering when they live in someone's head.
license: MIT
metadata:
  author: tp-job (enhanced by Claude)
  version: "1.1.0"
  source: PERN/MERN requirement extraction methodology (compiled 2026)
---

# SKILL: Autonomous Requirement Extraction
**Stack:** PERN / MERN · **Team:** 1–5 · **Style:** Micro Design

---

## AUTONOMOUS PROTOCOL

Agent runs this skill in ONE pass — no confirmation, no follow-up questions.

```
STEP 1  Detect stack, mode, and layer scope from input
STEP 2  Run all applicable analysis sections
STEP 3  Generate complete Markdown document
STEP 4  Append ASSUMPTIONS block for anything inferred
STEP 5  Output document immediately
```

**Confidence annotation** — prefix uncertain items with:
- `[INFERRED]` — derived from code patterns, not explicit
- `[ASSUMED]` — reasonable default for PERN/MERN, verify with team
- `[MISSING]` — cannot determine; human must fill in

---

## STEP 1 — Auto-Detect Context

### Mode Detection
| What agent receives | Mode |
|---|---|
| Source code only | **REVERSE** — extract what exists |
| Feature description / idea | **FORWARD** — define what to build |
| Code + desired behavior diff | **GAP** — current vs target |

### Stack Layer Detection
Scan for presence of:
- `useState / useEffect / JSX` → **L1: React Component**
- `fetch / axios / useSWR / react-query` → **L2: API Consumer**
- `express / router / middleware` → **L3: Express API**
- `mongoose / prisma / pg / knex` → **L4: DB Model**
- `WebGLRenderer / THREE / GLSL` → **L5: WebGL**
- `next/router / getServerSideProps / app/` → **L6: SSR/Next.js**
- `jwt / bcrypt / passport / session` → **L7: Auth**

Run analysis only for detected layers. Skip silently.

---

## STEP 2A — Frontend Component Contract (L1 always)

### Props Interface
Extract and document every prop:
```
PROP: [name]
Type:     [TypeScript type or inferred]
Default:  [value or undefined]
Required: [yes/no]
Role:     [what it controls in the UI]
DS Token: [if maps to a design token]
```

Flag `⚠️ MISSING TYPE` for untyped props.

### State Inventory
```
STATE: [name]  Type: [type]
Tracks:  [what this state represents]
Mutated: [which functions change it]
Drives:  [what re-renders or effects depend on it]
```

### Side Effects Map
For every `useEffect`:
```
EFFECT #[n]
Deps:    [dependency array]
Does:    [what it creates/starts/subscribes]
Cleanup: [what it destroys/stops/unsubscribes]  ← required; flag if missing
```

### Micro Design Classification
Classify component tier and flag violations.
Read [micro-design-checklist](references/micro-design-checklist.md) for full rules.

```
TIER: atom | molecule | organism | template | page
Lines of code: [count]
Single responsibility: [yes / no — describe if no]
Prop drilling depth: [N levels]  ← flag if > 2
Testable in isolation: [yes / no]
```

---

## STEP 2B — API Contract (L2/L3 if detected)

For each endpoint consumed or defined:
```
ENDPOINT: [METHOD] /api/[path]
Consumer:  [component name]
Auth:      [required / public / role-based]
Request:
  Params:  [url params]
  Query:   [query string]
  Body:    { field: type, required: bool }
Response:
  200:     { field: type }
  Error:   [400/401/403/404/500 cases]
Side Effects: [DB writes, emails, cache busts]
```

---

## STEP 2C — DB Schema Contract (L4 if detected)

```
COLLECTION/TABLE: [name]  DB: [PostgreSQL | MongoDB]
Fields:
  [field]: [type] [constraints] — [semantic purpose]
Indexes:  [field(s) → query pattern served]
Relations: [FK refs or embedded docs]
New fields needed: [list any required by this feature]
Migration required: [yes / no]
```

---

## STEP 3 — Requirements

Generate for ALL detected layers. Use this format:

```
REQ-[LAYER]-[N]: [Short title]
Priority:  P0 Blocker | P1 High | P2 Medium | P3 Low
Layer:     [L1..L7]
Story:     As a [actor], I need [behaviour] so that [value].
AC:        Given [context], when [action], then [outcome].
DS Ref:    [design token or DS section if applicable]
```

### Mandatory Requirements by Category

**Lifecycle** (every component)
- Mount: initial state, resource allocation, animation start
- Active: user interactions, data polling, state transitions
- Unmount: all timers/RAF/listeners cleared, WebGL disposed

**Visual & DS Compliance**
- All color values map to design tokens (no raw hex in JSX)
- All motion values use defined easing constants
- Font families match DS spec with correct fallback stack
- Spacing uses token values or clamp() with documented range

**Performance**
- Target FPS: [60 desktop / 30 mobile unless specified]
- Bundle size budget: [set or mark as ASSUMED: < 50KB per component]
- No synchronous operations on main thread during animation

**Accessibility**
- `role` and `aria-*` attributes present for dynamic content
- `prefers-reduced-motion` respected (mark MISSING if absent)
- Keyboard-accessible interactive elements

**Security (L3/L7)**
- All inputs sanitized server-side
- Auth middleware applied on protected routes
- No sensitive data in client-side state or localStorage

---

## STEP 4 — Non-Functional Requirements

Auto-score each NFR: ✅ Met · ⚠️ Partial · ❌ Missing · `[MISSING]` Unknown

| NFR | Status | Evidence / Note |
|---|---|---|
| TypeScript types | | |
| useEffect cleanup | | |
| Error boundaries | | |
| Loading states | | |
| prefers-reduced-motion | | |
| ARIA roles | | |
| DS token compliance | | |
| API error handling | | |
| DB query indexes | | |
| Auth on sensitive routes | | |

---

## STEP 5 — Risk Register (Lean)

Include only real risks found in code. No speculative risks.

```
RISK-[N]: [Title]
Likelihood: High | Medium | Low
Impact:     High | Medium | Low
Evidence:   [specific code pattern or absence that signals this]
Mitigation: [concrete action in 1–2 sentences]
Owner:      Frontend | Backend | Both
```

---

## STEP 6 — Sign-off Checklist (Small Team)

```markdown
## Sign-off: [Component/Feature Name]

### Developer
- [ ] All REQ-* implemented and self-tested
- [ ] No TypeScript errors or eslint warnings
- [ ] useEffect cleanup verified (no memory leaks)
- [ ] DS tokens used throughout (no magic numbers)

### Designer (if applicable)
- [ ] Visual output matches Figma/spec
- [ ] DS version compliance confirmed
- [ ] Responsive behavior validated

### QA / Second Developer
- [ ] P0 and P1 acceptance criteria pass
- [ ] API error states tested
- [ ] Auth edge cases tested (if applicable)
```

---

## OUTPUT DOCUMENT TEMPLATE

Agent generates a file named `REQ-[ComponentName]-[YYYYMMDD].md`:

```markdown
# Requirements: [Component/Feature Name]
**Date:** [YYYY-MM-DD]  **Mode:** REVERSE | FORWARD | GAP
**Stack layers:** [detected layers]  **DS Version:** [if found]

---

## Component Contract
[STEP 2A output]

## API Contract
[STEP 2B output — omit if L2/L3 not detected]

## DB Contract
[STEP 2C output — omit if L4 not detected]

## Requirements
[STEP 3 output — REQ-L1-001, REQ-L2-001, etc.]

## Non-Functional Requirements
[STEP 4 table]

## Risk Register
[STEP 5 output — only real risks]

## Sign-off Checklist
[STEP 6 output]

---

## Assumptions & Inferences
[All [INFERRED] and [ASSUMED] items consolidated here]
[All [MISSING] items that human must fill in]
```

---

## Reference Files

- [micro-design-checklist](references/micro-design-checklist.md) — Atomic sizing rules, naming conventions, DS compliance
- [full-stack-contract](references/full-stack-contract.md) — API + DB contract patterns for PERN/MERN
- [webgl-requirements](references/webgl-requirements.md) — Requirement-gathering guidance specific to WebGL/3D features

Read these only when deeper guidance is needed for that specific area.

---

**Where this fits:** use this skill when the requirements already live in code — REVERSE mode to document what is there, GAP mode to name the delta against a desired behavior. When the requirements instead live in someone's head as a one-line ask, a different tool writes that kind of target. **What exists is evidence, not a specification** — a bug faithfully documented is still a bug; deciding which extracted behavior is actually intended is a judgment call, not this skill's job.

These are copies, not forks. Refresh them from the skill library rather than editing them in place; the only thing that differs from the originals is the depth of their relative links.