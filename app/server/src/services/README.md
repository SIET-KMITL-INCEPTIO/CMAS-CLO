# services/

**All business logic lives here.** Nothing else in the server may contain
domain rules — see [dev.md §7.1](../../../../docs/markdown/dev/dev.md).

```
Route  →  Controller  →  Service  →  Prisma
                         ^^^^^^^
                         you are here
```

## Contract

- One file per resource: `clo.service.ts`, `course.service.ts`, …
- Export a class (`CloService`) whose methods take plain typed inputs and
  return plain data — never `FastifyRequest` or `FastifyReply`.
- Services may import `prisma`. Controllers may **not**.
- Anything atomic goes in `prisma.$transaction`.
- Throw on failure; the global `errorHandler` maps errors to responses.

## Example

```ts
import { prisma } from "../lib/prisma.js"
import type { CreateCloInput } from "../validators/clo.validator.js"

export class CloService {
  async listByCourse(courseId: string) {
    return prisma.cLO.findMany({
      where: { courseId },
      include: { objectives: true, criteria: true },
      orderBy: { number: "asc" },
    })
  }
}
```

## Testing

Services are the highest-value test target (80% coverage per dev.md §11.1).
Put tests next to the file: `clo.service.test.ts`.
