import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { allows, CAPABILITIES } from "./capabilities.ts"

// vitest runs from app/client
const SERVER = resolve(process.cwd(), "../server/src/modules/authorization/capabilities.ts")

/** `"cap": { scope: "course", roles: TEACH }` rows of the server table, roles resolved. */
function serverTable() {
  const src = readFileSync(SERVER, "utf8")
  const rows = [
    ...src.matchAll(/"([a-z.]+)":\s*\{\s*scope:\s*"(\w+)",\s*roles:\s*(TEACH|\[[^\]]*\])/g),
  ]
  return Object.fromEntries(
    rows.map(([, cap, scope, roles]) => [
      cap,
      {
        scope,
        roles:
          roles === "TEACH" ? ["INSTRUCTOR"] : [...roles!.matchAll(/"(\w+)"/g)].map((m) => m[1]),
      },
    ]),
  )
}

describe("capabilities", () => {
  it("is the same table as the server's", () => {
    const mine = Object.fromEntries(
      Object.entries(CAPABILITIES).map(([k, v]) => [k, { scope: v.scope, roles: [...v.roles] }]),
    )
    expect(mine).toEqual(serverTable())
  })

  const course = { instructors: [{ userId: "t1" }] }
  it("lets a course's instructor do teaching work, nobody else", () => {
    expect(allows("score.edit", { id: "t1", role: "INSTRUCTOR" }, course)).toBe(true)
    expect(allows("score.edit", { id: "t2", role: "INSTRUCTOR" }, course)).toBe(false)
  })

  it("lets ADMIN read and manage staff but not teach (D-1)", () => {
    const admin = { id: "a", role: "ADMIN" } as const
    expect(allows("course.view", admin, course)).toBe(true)
    expect(allows("staff.write", admin, course)).toBe(true)
    expect(allows("score.edit", admin, course)).toBe(false)
    expect(allows("user.manage", admin)).toBe(true)
  })
})
