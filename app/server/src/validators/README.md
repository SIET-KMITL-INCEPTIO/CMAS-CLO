# validators/

Zod schemas — **one per resource**, the single definition of what a request
body may contain. Target coverage: 90% (dev.md §11.1).

## Contract

- File name: `clo.validator.ts`, `course.validator.ts`, …
- Export the schema _and_ its inferred type, so services and controllers share
  one source of truth instead of redeclaring shapes:

```ts
import { z } from "zod"

export const createCloSchema = z.object({
  courseId: z.string().cuid(),
  description: z.string().min(1).max(500),
  threshold: z.number().min(0).max(100).default(60),
})

export type CreateCloInput = z.infer<typeof createCloSchema>
```

- Encode the _business_ rules the database can't, and return 422-worthy
  messages: activity weights summing to 100, `score <= maxScore`, CLO
  `threshold` within 0–100.
- Never trust client-side validation. Excel uploads must be validated row by
  row on the server (dev.md §6.4, §13 Security).

## Testing

Pure functions with no I/O — the cheapest tests in the repo. Cover the
rejection cases, not just the happy path.
