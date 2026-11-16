/**
 * FR-07 end to end on a migrated database (0010): ask for a link, open it,
 * get a session. Runs only when CMAS_DB_TESTS=1. With no SMTP_URL outside
 * production the link goes to the log, which is where this test reads it.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { prisma } from "../../db/prisma.js"
import { RUN_DB_TESTS, setupFixture, TEST_DOMAIN, type Fixture } from "../../test/db-fixture.js"

describe.skipIf(!RUN_DB_TESTS)("sign-in by email link (FR-07)", () => {
  let f: Fixture
  const logged: string[] = []

  beforeAll(async () => {
    f = await setupFixture()
    vi.spyOn(console, "info").mockImplementation((line: string) => void logged.push(line))
  })
  afterAll(async () => {
    vi.restoreAllMocks()
    // A link for an address with no account has no userId, so no cascade removes it.
    await prisma.emailVerificationToken.deleteMany({ where: { email: { endsWith: TEST_DOMAIN } } })
    await f.close()
  })

  const ask = (email: string) =>
    f.call(null, { method: "POST", url: "/api/v1/auth/email-link", payload: { email } })
  const open = (token: string) =>
    f.call(null, { method: "POST", url: "/api/v1/auth/email-link/verify", payload: { token } })
  /** The newest link the dev mailer printed for this address. */
  const linkFor = async (email: string) => {
    await vi.waitFor(() => expect(logged.some((l) => l.includes(email))).toBe(true))
    const line = logged.filter((l) => l.includes(email)).at(-1)!
    return /#([A-Za-z0-9_-]{43})/.exec(line)![1]!
  }

  it("signs an existing account in and sets the refresh cookie", async () => {
    const me = await prisma.user.findUniqueOrThrow({ where: { id: f.users.teacherA.id } })
    const res = await ask(me.email.toUpperCase())
    expect(res.statusCode).toBe(200)

    const token = await linkFor(me.email)
    const row = await prisma.emailVerificationToken.findFirstOrThrow({
      where: { email: me.email },
      orderBy: { createdAt: "desc" },
    })
    expect(row.userId).toBe(me.id)
    expect(row.tokenHash).not.toBe(token) // only the hash is stored

    const signedIn = await open(token)
    expect(signedIn.statusCode).toBe(200)
    expect(signedIn.json().data).toMatchObject({ status: "ACTIVE", user: { id: me.id } })
    expect(signedIn.headers["set-cookie"]).toBeDefined()
    expect((await open(token)).statusCode).toBe(401) // single use
    expect(
      await prisma.authEvent.count({ where: { userId: me.id, action: "LOGIN" } }),
    ).toBeGreaterThan(0)
  })

  it("creates an out-of-domain account PENDING only when the link is opened (FR-08)", async () => {
    const email = `link-${Date.now()}${TEST_DOMAIN}`
    expect((await ask(email)).statusCode).toBe(200)
    expect(await prisma.user.count({ where: { email } })).toBe(0)

    const res = await open(await linkFor(email))
    expect(res.json().data).toMatchObject({ status: "PENDING", email })
    const user = await prisma.user.findUniqueOrThrow({ where: { email } })
    expect(user).toMatchObject({ status: "PENDING", authProvider: "EMAIL", role: "INSTRUCTOR" })
    expect(await prisma.authEvent.count({ where: { userId: user.id, action: "REGISTER" } })).toBe(1)
  })
})
