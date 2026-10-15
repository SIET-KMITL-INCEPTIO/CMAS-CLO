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
})
