# controllers/

**Thin request/response layer — no business logic.** A controller parses input,
calls exactly one service, and returns a response helper.

```
Route  →  Controller  →  Service  →  Prisma
          ^^^^^^^^^^
          you are here
```

## Contract

- One file per resource: `clos.controller.ts`, `courses.controller.ts`, …
- Validate with the matching Zod schema from `../validators/`. Let `ZodError`
  propagate — `errorHandler` turns it into a 400.
- Return via `../lib/response.js` (`ok`, `created`, `notFound`, …) so every
  endpoint emits the same `{ success, data | message | errors }` envelope.
- **Never** import `prisma` here. If you need a query, it belongs in a service.
- Use arrow-function class properties so `this` survives Fastify's dispatch.

## Example

```ts
import type { FastifyReply, FastifyRequest } from "fastify"
import { CloService } from "../services/clo.service.js"
import { createCloSchema } from "../validators/clo.validator.js"
import { created, ok } from "../lib/response.js"

export class CloController {
  private service = new CloService()

  list = async (req: FastifyRequest<{ Params: { courseId: string } }>, reply: FastifyReply) => {
    return ok(reply, await this.service.listByCourse(req.params.courseId))
  }

  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = createCloSchema.parse(req.body)
    return created(reply, await this.service.create(parsed))
  }
}
```
