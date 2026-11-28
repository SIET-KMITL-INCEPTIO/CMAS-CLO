/** Characterization tests (refactor-plan.md P0): pin SessionService's refresh rules (S-1, S-2, NFR-19). */
import { describe, expect, it, vi } from "vitest"
import { signAccessToken, signRefreshToken, verifyAccessToken } from "../../lib/jwt.js"
import type { AuthEventRepository } from "../users/auth-event.repository.js"
import type { UserRepository } from "../users/user.repository.js"
import type { RefreshTokenRepository } from "./refresh-token.repository.js"
import { durationMs, REFRESH_TTL_MS, SessionService } from "./session.service.js"

const live = {
  id: "t1",
  userId: "u1",
  familyId: "f1",
  revokedAt: null as Date | null,
  expiresAt: new Date(Date.now() + 60_000),
}
const user = { id: "u1", role: "INSTRUCTOR", isActive: true, status: "ACTIVE" }

function setup(over: { row?: unknown; user?: unknown; rotated?: boolean } = {}) {
  const tokens = {
    create: vi.fn(async () => {}),
    findByToken: vi.fn(async () => ("row" in over ? over.row : live) as typeof live | null),
    revokeFamily: vi.fn(async () => {}),
    rotate: vi.fn(async () => over.rotated ?? true),
  }
  const users = {
    findById: vi.fn(async () => ("user" in over ? over.user : user) as typeof user | null),
  }
  const events = { record: vi.fn(async (..._args: unknown[]) => {}) }
  const service = new SessionService(
    tokens as unknown as RefreshTokenRepository,
    users as unknown as Pick<UserRepository, "findById">,
    events as unknown as AuthEventRepository,
  )
  return { service, tokens, users, events }
}

const refreshToken = () => signRefreshToken({ sub: "u1", role: "INSTRUCTOR" })

describe("durationMs", () => {
  it.each([
    ["3600s", 3_600_000],
    ["15m", 900_000],
    [" 2h ", 7_200_000],
    ["7d", 604_800_000],
  ])("%s", (v, ms) => expect(durationMs(v)).toBe(ms))

  it.each(["", "7", "d7", "1w", "-1d", "1.5h"])("refuses %j", (v) => {
    expect(() => durationMs(v)).toThrow("Unreadable duration")
  })

  it("REFRESH_TTL_MS is the configured refresh lifetime", () => {
    expect(REFRESH_TTL_MS).toBeGreaterThan(0)
  })
})

describe("start / registered", () => {
  it("stores a new family and records the Google login by default", async () => {
    const { service, tokens, events } = setup()
    await service.start("u1", "tok")
    expect(tokens.create).toHaveBeenCalledWith("u1", "tok", null, expect.any(Date))
    expect(events.record).toHaveBeenCalledWith("u1", "u1", "LOGIN_GOOGLE", undefined)
  })

  it("an email-link sign-in is recorded as LOGIN with its note", async () => {
    const { service, events } = setup()
    await service.start("u1", "tok", "LOGIN")
    expect(events.record).toHaveBeenCalledWith("u1", "u1", "LOGIN", "เข้าสู่ระบบด้วยลิงก์อีเมล")
  })

  it("registration notes whether the account waits for approval", async () => {
    const { service, events } = setup()
    await service.registered("u1", true)
    await service.registered("u1", false)
    expect(events.record.mock.calls.map((c) => c[2])).toEqual(["REGISTER", "REGISTER"])
    expect(events.record.mock.calls[0]![3]).toContain("รอผู้ดูแลระบบอนุมัติ")
    expect(events.record.mock.calls[1]![3]).toBe("ลงทะเบียนด้วยลิงก์อีเมล")
  })
})

describe("refresh", () => {
  it("rotates a good token into a new access + refresh pair for the LIVE role (NFR-19)", async () => {
    const { service, tokens } = setup({ user: { ...user, role: "ADMIN" } })
    const r = await service.refresh(await refreshToken())
    expect(r.outcome).toBe("ok")
    if (r.outcome !== "ok") return
    await expect(verifyAccessToken(r.accessToken)).resolves.toEqual({ sub: "u1", role: "ADMIN" })
    expect(tokens.rotate).toHaveBeenCalledWith("t1", "u1", "f1", r.refreshToken, expect.any(Date))
    // The controller answers with this account's live profile, so a reload skips GET /auth/me.
    expect(r.userId).toBe("u1")
  })

  it("every failure is the same bare 'invalid' answer, and touches nothing it should not", async () => {
    const good = await refreshToken()
    const none = setup()
    expect(await none.service.refresh(undefined)).toEqual({ outcome: "invalid" })
    expect(none.tokens.findByToken).not.toHaveBeenCalled()

    // Forged, and an access token presented as a refresh token (S-1).
    for (const bad of ["garbage", await signAccessToken({ sub: "u1", role: "ADMIN" })]) {
      const s = setup()
      expect(await s.service.refresh(bad)).toEqual({ outcome: "invalid" })
      expect(s.tokens.findByToken).not.toHaveBeenCalled()
    }

    const unknown = setup({ row: null })
    expect(await unknown.service.refresh(good)).toEqual({ outcome: "invalid" })
    expect(unknown.tokens.revokeFamily).not.toHaveBeenCalled()

    const expired = setup({ row: { ...live, expiresAt: new Date(Date.now() - 1) } })
    expect(await expired.service.refresh(good)).toEqual({ outcome: "invalid" })
    expect(expired.tokens.rotate).not.toHaveBeenCalled()
  })

  it("a revoked token being shown again kills its whole family (reuse)", async () => {
    const { service, tokens } = setup({ row: { ...live, revokedAt: new Date(0) } })
    expect(await service.refresh(await refreshToken())).toEqual({ outcome: "invalid" })
    expect(tokens.revokeFamily).toHaveBeenCalledWith("f1")
    expect(tokens.rotate).not.toHaveBeenCalled()
  })

  it.each([
    ["missing", null],
    ["deactivated", { ...user, isActive: false }],
    ["not ACTIVE", { ...user, status: "PENDING" }],
  ])("a %s account kills the family", async (_n, u) => {
    const { service, tokens } = setup({ user: u })
    expect(await service.refresh(await refreshToken())).toEqual({ outcome: "invalid" })
    expect(tokens.revokeFamily).toHaveBeenCalledWith("f1")
    expect(tokens.rotate).not.toHaveBeenCalled()
  })

  it("losing the rotation race is reuse: invalid, and the family dies", async () => {
    const { service, tokens } = setup({ rotated: false })
    expect(await service.refresh(await refreshToken())).toEqual({ outcome: "invalid" })
    expect(tokens.revokeFamily).toHaveBeenCalledWith("f1")
  })
})

describe("end", () => {
  it("revokes the family of this user's own token and records the logout", async () => {
    const { service, tokens, events } = setup()
    await service.end("u1", "tok")
    expect(tokens.revokeFamily).toHaveBeenCalledWith("f1")
    expect(events.record).toHaveBeenCalledWith("u1", "u1", "LOGOUT")
  })

  it("never revokes someone else's token, and still records the logout", async () => {
    const { service, tokens, events } = setup({ row: { ...live, userId: "other" } })
    await service.end("u1", "tok")
    expect(tokens.revokeFamily).not.toHaveBeenCalled()
    expect(events.record).toHaveBeenCalledTimes(1)
  })

  it("with no cookie it only records the logout", async () => {
    const { service, tokens, events } = setup()
    await service.end("u1", undefined)
    expect(tokens.findByToken).not.toHaveBeenCalled()
    expect(events.record).toHaveBeenCalledWith("u1", "u1", "LOGOUT")
  })
})
