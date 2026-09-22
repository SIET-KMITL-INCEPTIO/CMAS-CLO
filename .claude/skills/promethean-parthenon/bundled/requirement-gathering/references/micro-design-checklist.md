# Micro Design Checklist — PERN/MERN Small Team Standard

## Atomic Tier Rules

| Tier | Lines | Single Responsibility | Composition |
|---|---|---|---|
| **Atom** | < 60 | One visual primitive (button, input, icon, badge) | No sub-components |
| **Molecule** | 60–180 | One UI concept (card, form-field, search-bar) | ≤ 3 atoms |
| **Organism** | 180–350 | One feature section (navbar, sidebar, data-table) | Multiple molecules |
| **Template** | 350–600 | Page layout skeleton | Organisms + slots |
| **Page** | Any | Route-level view | Template + data |

Flag `⚠️ OVERLOADED` if component exceeds tier line count by > 30%.
Flag `⚠️ WRONG TIER` if component mixes responsibilities from 2+ tiers.

---

## Naming Conventions

```
Components:   PascalCase          — UserCard, LoadingScreen
Props:        camelCase           — onComplete, isLoading
Events:       on[Event]           — onClick, onSubmit, onComplete
Boolean props: is/has/can/should  — isOpen, hasError, canSubmit
Refs:         [name]Ref           — timerRef, mountRef
Constants:    UPPER_SNAKE_CASE    — EASE_SPRING, MAX_RETRIES
DS tokens:    C.[name]            — C.periwinkle, C.charcoal
```

---

## Props API Rules

1. **No prop drilling beyond 2 levels** — use Context or state management at 3+
2. **No more than 8 props** on a single component — split if exceeded
3. **All boolean props default to `false`** — never require user to pass `false`
4. **All callback props prefixed `on`** — `onClose`, not `closeHandler`
5. **No objects as required props without a defined interface**
6. **Event handler props typed as** `() => void` or `(value: T) => void`

---

## Design Token Compliance

✅ Allowed:
```tsx
// Token reference
color: C.periwinkle
background: C.charcoal
transition: `${duration} ${EASE_SPRING}`

// clamp() for responsive values — must document range
fontSize: "clamp(1rem, 3vw, 1.5rem)"  // min 16px, max 24px
```

❌ Flag as TOKEN DEBT:
```tsx
color: "#C8CDEB"          // raw hex without token ref
background: "rgba(10,15,25,0.8)"  // unlisted rgba
fontSize: "14px"           // hardcoded, not token or clamp
transition: "0.3s ease"   // non-DS easing value
```

---

## Component File Structure Standard

```
ComponentName/
├── index.tsx          — main component export
├── ComponentName.tsx  — implementation (if complex)
├── types.ts           — interfaces & types
├── constants.ts       — component-local DS tokens, configs
├── hooks/
│   └── useComponentLogic.ts  — extract complex logic here
└── ComponentName.test.tsx    — unit tests
```

Single-file rule: atoms and simple molecules can live in one file.

---

## Testability Checklist

A well-designed micro component can:
- [ ] Render in isolation (no required external context)
- [ ] Accept all states via props (loading, error, empty, filled)
- [ ] Trigger callbacks testable with `@testing-library/react`
- [ ] Animate or not based on a prop (not OS-level only)
- [ ] Work with mock data without network calls