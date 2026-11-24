import type { User } from "@prisma/client"
import { describe, expect, it } from "vitest"
import { ConflictError } from "../../lib/errors.js"
import type { AuthEventRepository } from "./auth-event.repository.js"
import type { UserRepository } from "./user.repository.js"
import { UsersService } from "./users.service.js"
import { createUserSchema } from "./users.validator.js"

/** UC 1.1 / 1.4 — POST /users (ST-AUTH-10). No database: the repositories are fakes. */
function setup(existing: string[] = []) {
  const rows = existing.map(
    (email, i) => ({ id: `u${i}`, email, name: email, role: "INSTRUCTOR" }) as User,
  )
  const events: { userId: string; action: string }[] = []
  const users = {
    findByEmailInsensitive: async (email: string) =>
      rows.find((r) => r.email.toLowerCase() === email.toLowerCase()) ?? null,
    createByAdmin: async (data: { email: string; name: string; role: User["role"] }) => {
      const row = { id: `u${rows.length}`, ...data } as User
      rows.push(row)
      return row
    },
    findProfile: async (id: string) => {
      const r = rows.find((x) => x.id === id)!
      return {
        ...r,
        status: "ACTIVE",
        isActive: true,
        courseAssignments: [],
        _count: { uploadLogs: 0 },
      }
    },
  } as unknown as UserRepository
  const log = {
    record: async (userId: string, _actor: string, action: string) =>
      void events.push({ userId, action }),
  } as unknown as AuthEventRepository
  return { service: new UsersService(users, log), rows, events }
}

describe("POST /users (UC 1.1)", () => {
  it("creates an ACTIVE account with the given role and records who made it", async () => {
    const { service, events } = setup()
    const user = await service.create(
      { email: "new@kmitl.ac.th", name: "อาจารย์ใหม่", role: "INSTRUCTOR" },
      "admin",
    )
    expect(user).toMatchObject({ email: "new@kmitl.ac.th", role: "INSTRUCTOR", status: "ACTIVE" })
    expect(events).toEqual([{ userId: user.id, action: "CREATE" }])
  })

  it("refuses an email that already has an account, whatever its case (409)", async () => {
    const { service, rows } = setup(["Somchai@KMITL.ac.th"])
    await expect(
      service.create({ email: "somchai@kmitl.ac.th", name: "x", role: "INSTRUCTOR" }, "admin"),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(rows).toHaveLength(1)
  })

  it("lower-cases the email and accepts no field beyond email, name and role", () => {
    expect(createUserSchema.parse({ email: " A@B.CO ", name: "a", role: "ADMIN" }).email).toBe(
      "a@b.co",
    )
    expect(() =>
      createUserSchema.parse({ email: "a@b.co", name: "a", role: "ADMIN", status: "ACTIVE" }),
    ).toThrow()
    expect(() => createUserSchema.parse({ email: "nope", name: "a", role: "ADMIN" })).toThrow()
  })
})
