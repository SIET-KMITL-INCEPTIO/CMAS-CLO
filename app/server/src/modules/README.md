# modules/

**One folder per feature, holding every server layer for that feature.** The folder
name matches the client feature in `app/client/src/features/` word for word, so
searching one name (`clos`) finds route, controller, service, validator and tests
together.

```
modules/clos/
├── clos.route.ts            paths + middleware registration only
├── clos.controller.ts       thin request/response layer
├── clos.service.ts          all business logic
├── clo.repository.ts        the only file that touches Prisma — named after the model
├── clos.validator.ts        Zod schemas + inferred types
└── clos.service.test.ts     tests next to the file they cover
```

```
Route  →  Controller  →  Service  →  Repository  →  Prisma (db/prisma.ts)
```

The four layers and their rules come from
[code-rule.md §3](../../../../docs/markdown/rule/code-rule.md). File names are
`kebab-case.<layer>.ts`: the feature word for route, controller, service and
validator, and the singular model name for the repository. The file exports a
`PascalCase` class named after its role (`clos.service.ts` exports `CloService`).

`index.ts` registers every module's routes. `authorization/` holds no route of its
own: it is the course-scope guard that every course-scoped service calls.

Shared code stays outside `modules/`: `middlewares/` (auth, RBAC, error handler),
`lib/` (env, jwt, response helpers), `db/` (the single `PrismaClient`).

---

## route: `<name>.route.ts`

- Paths, prefixes, and `preHandler: [authMiddleware, rbac(...)]` only. No logic.
- Every authenticated route runs `authMiddleware`. Any route with `:courseId`
  must reach `assertCourseAccess()` before touching data (see `index.ts`).

## controller: `<name>.controller.ts`

**No business logic.** A controller parses input, calls exactly one service, and
returns a response helper.

- Validate with the matching schema from `<name>.validator.ts`. Let `ZodError`
  propagate, because `error-handler.middleware.ts` turns it into a 400.
- Return via `lib/response.js` (`ok`, `created`, `notFound`, …) so every
  endpoint emits the same `{ success, data | message | errors }` envelope.
- **Never** import `prisma` or a repository here. Call the service.
- Use arrow-function class properties so `this` survives Fastify's dispatch.

```ts
import type { FastifyReply, FastifyRequest } from "fastify"
import { CloService } from "./clos.service.js"
import { createCloSchema } from "./clos.validator.js"
import { created, ok } from "../../lib/response.js"

export class CloController {
  constructor(private readonly service: CloService) {}

  list = async (req: FastifyRequest<{ Params: { courseId: string } }>, reply: FastifyReply) => {
    return ok(reply, await this.service.listByCourse(req.params.courseId))
  }

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = createCloSchema.parse(req.body)
    return created(reply, await this.service.create(parsed))
  }
}
```

## service: `<name>.service.ts`

**All business logic lives here.** No other layer may contain domain rules. See
[dev.md §7.1](../../../../docs/markdown/dev/architecture/dev.md).

- Export a class (`CloService`) whose methods take plain typed inputs and return
  plain data, never `FastifyRequest` or `FastifyReply`.
- **Never** call `prisma.*` directly. Go through the module's repository,
  passed in through the constructor (code-rule §3).
- Put transactions in the repository and expose them as one method, so the
  service does not need to know Prisma exists.
- Throw on failure. The global error handler maps errors to responses.
- Services are the highest-value test target (80% coverage per dev.md §11.1).

```ts
import type { CloRepository } from "./clo.repository.js"

export class CloService {
  constructor(private readonly cloRepo: CloRepository) {}

  async listByCourse(courseId: string) {
    return this.cloRepo.listByCourse(courseId)
  }
}
```

## repository: `<model>.repository.ts`

Talks to Prisma and nothing else. **No business rules**: it returns raw data.

```ts
import type { PrismaClient } from "@prisma/client"

export class CloRepository {
  constructor(private readonly prisma: PrismaClient) {}

  listByCourse(courseId: string) {
    return this.prisma.cLO.findMany({
      where: { courseId },
      include: { objectives: true, criteria: true },
      orderBy: { number: "asc" },
    })
  }
}
```

Wire the chain once, in the route file:
`new CloController(new CloService(new CloRepository(prisma)))`.

## validator: `<name>.validator.ts`

Zod schemas: the single definition of what a request body may contain. Target
coverage: 90% (dev.md §11.1).

- Export the schema _and_ its inferred type, so the service and controller share
  one definition instead of each declaring the shape again:

```ts
import { z } from "zod"

export const createCloSchema = z.object({
  courseId: z.string().cuid(),
  description: z.string().min(1).max(500),
  threshold: z.number().min(0).max(100).default(60),
})

export type CreateCloInput = z.infer<typeof createCloSchema>
```

- Encode the _business_ rules the database can't enforce, and return messages
  that justify a 422: activity weights summing to 100, `score <= maxScore`, CLO
  `threshold` within 0–100.
- Never trust client-side validation. Validate Excel uploads row by row on the
  server (dev.md §6.4, §13 Security).
- These are pure functions with no I/O, so they are the cheapest tests in the
  repo. Cover the rejection cases, not just the happy path.
