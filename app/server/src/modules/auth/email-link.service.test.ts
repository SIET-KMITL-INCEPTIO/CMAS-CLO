import type { AccountStatus, Role, User } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Mail } from "../../lib/mailer.js"
import { EmailLinkService, RESEND_AFTER_MS } from "./email-link.service.js"

/** FR-07 (one-time link), FR-08 (domain rule), FR-03 (suspended), FR-05a (ADMIN_EMAILS). */
const ADMIN = "boss@gmail.com"

function fakeUsers() {
  const rows: User[] = []
  const update = (id: string, data: Partial<User>) => {
    const row = rows.find((r) => r.id === id)!
    Object.assign(row, data)
    return Promise.resolve({ ...row })
  }
  return {
    rows,
    add(email: string, extra: Partial<User> = {}) {
      rows.push({
        id: `u${rows.length + 1}`,
        email,
        name: email,
        role: "INSTRUCTOR" as Role,
        status: "ACTIVE" as AccountStatus,
        isActive: true,
        emailVerifiedAt: new Date(),
        ...extra,
      } as User)
    },
    findByEmailInsensitive: (email: string) =>
      Promise.resolve(rows.find((r) => r.email.toLowerCase() === email) ?? null),
    createFromEmail: (data: { email: string; role: Role; status: AccountStatus }) => {
      const row = {
        id: `u${rows.length + 1}`,
        name: data.email.split("@")[0],
        isActive: true,
        emailVerifiedAt: new Date(),
        ...data,
      } as User
      rows.push(row)
      return Promise.resolve({ ...row })
    },
    markEmailVerified: (id: string) => update(id, { emailVerifiedAt: new Date() }),
    grantAdmin: (id: string) => update(id, { role: "ADMIN", status: "ACTIVE" }),
  }
}

/** In-memory EmailVerificationToken: plain tokens stand in for their hashes. */
function fakeLinks() {
  type Row = { email: string; token: string; expiresAt: Date; usedAt: Date | null; at: Date }
  const rows: Row[] = []
  return {
    rows,
    lastIssuedAt: (email: string) =>
      Promise.resolve(rows.filter((r) => r.email === email).at(-1)?.at ?? null),
    issue: (email: string, _userId: string | null, token: string, expiresAt: Date) => {
      for (const r of rows) if (r.email === email && !r.usedAt) r.usedAt = new Date()
      rows.push({ email, token, expiresAt, usedAt: null, at: new Date() })
      return Promise.resolve()
    },
    consume: (token: string) => {
      const r = rows.find((x) => x.token === token && !x.usedAt && x.expiresAt > new Date())
      if (!r) return Promise.resolve(null)
      r.usedAt = new Date()
      return Promise.resolve(r.email)
    },
  }
}

let users: ReturnType<typeof fakeUsers>
let links: ReturnType<typeof fakeLinks>
let sent: Mail[]
let service: EmailLinkService

const tokenOf = (mail: Mail) => /#([A-Za-z0-9_-]{43})/.exec(mail.text)![1]!

/** Each ask lands outside the previous one's 60-second window. */
async function ask(email: string) {
  vi.setSystemTime(Date.now() + RESEND_AFTER_MS)
  return service.request(email)
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] })
  users = fakeUsers()
  links = fakeLinks()
  sent = []
  service = new EmailLinkService(
    users,
    links,
    {
      send: (m) => {
        sent.push(m)
        return Promise.resolve()
      },
    },
    [ADMIN],
    "https://cmas.test",
  )
})

describe("asking for a link (FR-07)", () => {
  it("mails a 43-character token in the URL fragment, never in a query string", async () => {
    expect(await ask("somchai@kmitl.ac.th")).toEqual({ outcome: "sent" })
    expect(sent[0]!.to).toBe("somchai@kmitl.ac.th")
    expect(sent[0]!.text).toMatch(/https:\/\/cmas\.test\/auth\/link#[A-Za-z0-9_-]{43}/)
    expect(sent[0]!.text).not.toContain("?")
  })

  it("answers the same for an address with no account, and creates nothing yet", async () => {
    expect(await ask("nobody@kmitl.ac.th")).toEqual({ outcome: "sent" })
    expect(users.rows).toHaveLength(0)
  })

  it("sends at most one link per email per 60 seconds, and still says sent", async () => {
    await ask("somchai@kmitl.ac.th")
    expect(await service.request("somchai@kmitl.ac.th")).toEqual({ outcome: "sent" })
    expect(sent).toHaveLength(1)
  })

  it("is unavailable when no mailer is configured (production without SMTP)", async () => {
    const off = new EmailLinkService(users, links, null, [], "https://cmas.test")
    expect(await off.request("somchai@kmitl.ac.th")).toEqual({ outcome: "unavailable" })
  })
})

describe("opening a link", () => {
  it("creates a faculty account ACTIVE and signs it in (FR-08)", async () => {
    await ask("new@kmitl.ac.th")
    expect(await service.verify(tokenOf(sent[0]!))).toMatchObject({
      outcome: "ok",
      registered: true,
    })
    expect(users.rows[0]).toMatchObject({ role: "INSTRUCTOR", status: "ACTIVE", name: "new" })
  })

  it("an exact domain only: a subdomain waits for an ADMIN like any other (FR-08)", async () => {
    await ask("x@it.kmitl.ac.th")
    expect(await service.verify(tokenOf(sent[0]!))).toMatchObject({
      outcome: "pending",
      registered: true,
    })
    expect(users.rows[0]!.status).toBe("PENDING")
  })

  it("works once: the same link again is invalid", async () => {
    await ask("somchai@kmitl.ac.th")
    const token = tokenOf(sent[0]!)
    expect((await service.verify(token)).outcome).toBe("ok")
    expect(await service.verify(token)).toEqual({ outcome: "invalid" })
  })

  it("a newer link retires the older one", async () => {
    await ask("somchai@kmitl.ac.th")
    await ask("somchai@kmitl.ac.th")
    expect(await service.verify(tokenOf(sent[0]!))).toEqual({ outcome: "invalid" })
    expect((await service.verify(tokenOf(sent[1]!))).outcome).toBe("ok")
  })

  it("expires after 24 hours", async () => {
    await ask("somchai@kmitl.ac.th")
    vi.setSystemTime(Date.now() + 24 * 60 * 60 * 1000 + 1)
    expect(await service.verify(tokenOf(sent[0]!))).toEqual({ outcome: "invalid" })
  })

  it("matches an existing account whatever its case, and does not register it again", async () => {
    users.add("Somchai@KMITL.ac.th", { emailVerifiedAt: null })
    await ask("somchai@kmitl.ac.th")
    expect(await service.verify(tokenOf(sent[0]!))).toMatchObject({
      outcome: "ok",
      registered: false,
    })
    expect(users.rows).toHaveLength(1)
    expect(users.rows[0]!.emailVerifiedAt).not.toBeNull()
  })

  it("names a suspension only after the link is opened (FR-03)", async () => {
    users.add("off@kmitl.ac.th", { isActive: false })
    expect(await ask("off@kmitl.ac.th")).toEqual({ outcome: "sent" })
    expect(await service.verify(tokenOf(sent[0]!))).toEqual({ outcome: "suspended" })
  })

  it("makes an ADMIN_EMAILS address ADMIN from any domain (FR-05a)", async () => {
    await ask(ADMIN)
    expect(await service.verify(tokenOf(sent[0]!))).toMatchObject({ outcome: "ok" })
    expect(users.rows[0]).toMatchObject({ role: "ADMIN", status: "ACTIVE" })
  })
})
