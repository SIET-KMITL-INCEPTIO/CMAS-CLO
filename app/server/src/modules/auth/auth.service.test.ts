import type { AccountStatus, Role, User } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { GoogleIdTokenPayload } from "../../lib/google.js"
import { AuthService } from "./auth.service.js"

/**
 * FR-08 (domain auto-approval) and FR-05a (ADMIN_EMAILS). The Google token
 * check is stubbed — lib/google.ts owns that — so each test only says who
 * signed in. isInstitutionDomain stays real, against the default kmitl.ac.th.
 */
const verify = vi.hoisted(() => vi.fn<(idToken: string) => Promise<GoogleIdTokenPayload>>())

vi.mock("../../lib/google.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../lib/google.js")>()),
  verifyGoogleIdToken: verify,
}))

const ADMIN = "phutiwanich@gmail.com"

/** In-memory stand-in for the slice of UserRepository that AuthService uses. */
function fakeUsers() {
  const rows: User[] = []
  const update = (id: string, data: Partial<User>) => {
    const row = rows.find((r) => r.id === id)!
    Object.assign(row, data)
    return Promise.resolve({ ...row })
  }
  return {
    rows,
    add(email: string, role: Role, status: AccountStatus, isActive = true) {
      rows.push({
        id: `u${rows.length + 1}`,
        email,
        role,
        status,
        isActive,
        googleSub: null,
      } as User)
    },
    findByGoogleSub: (sub: string) =>
      Promise.resolve(rows.find((r) => r.googleSub === sub) ?? null),
    findByEmail: (email: string) => Promise.resolve(rows.find((r) => r.email === email) ?? null),
    linkGoogleSub: (id: string, googleSub: string) => update(id, { googleSub }),
    createFromGoogle: (data: {
      email: string
      name: string
      googleSub: string
      role: Role
      status: AccountStatus
    }) => {
      const row = { id: `u${rows.length + 1}`, isActive: true, ...data } as User
      rows.push(row)
      return Promise.resolve({ ...row })
    },
    grantAdmin: vi.fn((id: string) => update(id, { role: "ADMIN", status: "ACTIVE" })),
  }
}

function signIn(email: string, extra: Partial<GoogleIdTokenPayload> = {}) {
  verify.mockResolvedValueOnce({ sub: `sub-${email}`, email, emailVerified: true, ...extra })
  return "id-token"
}

let users: ReturnType<typeof fakeUsers>
let service: AuthService

beforeEach(() => {
  users = fakeUsers()
  service = new AuthService(users, [ADMIN])
})

describe("Google sign-in — institution domain (FR-08)", () => {
  it("lets a new @kmitl.ac.th account straight in as INSTRUCTOR", async () => {
    const result = await service.loginWithGoogle(signIn("somchai@kmitl.ac.th"))

    expect(result.outcome).toBe("ok")
    expect(users.rows[0]).toMatchObject({ role: "INSTRUCTOR", status: "ACTIVE" })
  })

  it("accepts the domain from the Workspace hd claim, in any letter case", async () => {
    const result = await service.loginWithGoogle(
      signIn("Somchai@KMITL.ac.th", { hd: "kmitl.ac.th" }),
    )

    expect(result.outcome).toBe("ok")
  })

  it("holds a new account from another domain as PENDING", async () => {
    const result = await service.loginWithGoogle(signIn("someone@gmail.com"))

    expect(result.outcome).toBe("pending")
    expect(users.rows[0]).toMatchObject({ role: "INSTRUCTOR", status: "PENDING" })
  })

  it("rejects a token whose email Google has not verified", async () => {
    const result = await service.loginWithGoogle(
      signIn("somchai@kmitl.ac.th", { emailVerified: false }),
    )

    expect(result.outcome).toBe("invalid")
    expect(users.rows).toHaveLength(0)
  })
})

describe("Google sign-in — ADMIN_EMAILS (FR-05a)", () => {
  it("creates a listed email as an ACTIVE ADMIN, whatever its domain", async () => {
    const result = await service.loginWithGoogle(signIn(ADMIN))

    expect(result).toMatchObject({ outcome: "ok", user: { role: "ADMIN", status: "ACTIVE" } })
  })

  it("matches the list without regard to letter case", async () => {
    const result = await service.loginWithGoogle(signIn("PhutiWanich@Gmail.com"))

    expect(result).toMatchObject({ outcome: "ok", user: { role: "ADMIN" } })
  })

  it("promotes a listed account that already signed in as PENDING", async () => {
    users.add(ADMIN, "INSTRUCTOR", "PENDING")

    const result = await service.loginWithGoogle(signIn(ADMIN))

    expect(result).toMatchObject({ outcome: "ok", user: { role: "ADMIN", status: "ACTIVE" } })
  })

  it("leaves an account an ADMIN switched off denied and unpromoted (FR-03)", async () => {
    users.add(ADMIN, "INSTRUCTOR", "PENDING", false)

    const result = await service.loginWithGoogle(signIn(ADMIN))

    expect(result.outcome).toBe("denied")
    expect(users.grantAdmin).not.toHaveBeenCalled()
  })

  it("does not write when a listed account is already an ACTIVE ADMIN", async () => {
    users.add(ADMIN, "ADMIN", "ACTIVE")

    await service.loginWithGoogle(signIn(ADMIN))

    expect(users.grantAdmin).not.toHaveBeenCalled()
  })

  it("never grants ADMIN to an unlisted @kmitl.ac.th account", async () => {
    const result = await service.loginWithGoogle(signIn("somchai@kmitl.ac.th"))

    expect(result).toMatchObject({ user: { role: "INSTRUCTOR" } })
  })
})
