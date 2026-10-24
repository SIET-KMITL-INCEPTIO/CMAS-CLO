import { SignJWT } from "jose"
import { describe, expect, it } from "vitest"
import { env } from "./env.js"
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken } from "./jwt.js"

const payload = { sub: "user-1", role: "INSTRUCTOR" as const }

describe("token kinds (S-1)", () => {
  it("accepts an access token as an access token", async () => {
    await expect(verifyAccessToken(await signAccessToken(payload))).resolves.toEqual(payload)
  })

  it("rejects a refresh token presented as an access token", async () => {
    await expect(verifyAccessToken(await signRefreshToken(payload))).rejects.toThrow()
  })

  it("rejects an access token presented as a refresh token", async () => {
    await expect(verifyRefreshToken(await signAccessToken(payload))).rejects.toThrow()
  })

  it("rejects a token signed before typ existed", async () => {
    const legacy = await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(new TextEncoder().encode(env.JWT_SECRET))
    await expect(verifyAccessToken(legacy)).rejects.toThrow()
  })

  it("rejects a token signed with another secret", async () => {
    const forged = await new SignJWT({ ...payload, typ: "access" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("15m")
      .sign(new TextEncoder().encode("x".repeat(40)))
    await expect(verifyAccessToken(forged)).rejects.toThrow()
  })

  it("accepts a refresh token as a refresh token", async () => {
    await expect(verifyRefreshToken(await signRefreshToken(payload))).resolves.toEqual(payload)
  })
})

// Each case below was a mutant that survived Stryker (ci-cd-plan.md §5.7):
// the check could be deleted and every test still passed.
describe("claims a validly signed token must still carry", () => {
  const secret = new TextEncoder().encode(env.JWT_SECRET)
  const signWith = (claims: Record<string, unknown>, alg = "HS256") =>
    new SignJWT({ typ: "access", ...claims })
      .setProtectedHeader({ alg })
      .setExpirationTime("15m")
      .sign(secret)

  it("rejects a token with no subject", async () => {
    await expect(verifyAccessToken(await signWith({ role: "ADMIN" }))).rejects.toThrow(
      "Token has no subject",
    )
  })

  it.each(["ADMIN", "INSTRUCTOR"])("accepts the role claim %s", async (role) => {
    await expect(verifyAccessToken(await signWith({ sub: "u", role }))).resolves.toEqual({
      sub: "u",
      role,
    })
  })

  it.each(["", "SUPERADMIN", undefined])("rejects the role claim %s", async (role) => {
    await expect(verifyAccessToken(await signWith({ sub: "u", role }))).rejects.toThrow(
      "Bad role claim",
    )
  })

  it("rejects HS512 even with the right secret: only HS256 is allowed", async () => {
    const other = await signWith({ sub: "u", role: "ADMIN" }, "HS512")
    await expect(verifyAccessToken(other)).rejects.toThrow()
  })
})
