import { randomUUID } from "node:crypto"
import { SignJWT, jwtVerify } from "jose"
import { env } from "./env.js"

const secret = new TextEncoder().encode(env.JWT_SECRET)

/**
 * Token payload. Single-tenant: no institution claim, and therefore no
 * institution-switch endpoint.
 *
 * `role` is a HINT for cheap checks. authMiddleware re-reads the live User row
 * on every request, so a demoted or deactivated account takes effect
 * immediately instead of waiting out the 15-minute access token (FR-03).
 */
export type JwtPayload = {
  sub: string
  role: "ADMIN" | "INSTRUCTOR"
}

/**
 * Both token kinds are signed with the same secret, so the kind has to be in
 * the token itself (S-1). Without `typ`, a 7-day refresh token passed every
 * check a 15-minute access token did and could be sent as a Bearer token.
 */
type TokenType = "access" | "refresh"

function sign(payload: JwtPayload, typ: TokenType, expiresIn: string) {
  return (
    new SignJWT({ ...payload, typ })
      .setProtectedHeader({ alg: "HS256" })
      // Two tokens for one user in the same second would otherwise be identical,
      // and RefreshToken.tokenHash is unique.
      .setJti(randomUUID())
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(secret)
  )
}

async function verify(token: string, typ: TokenType): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })
  // A token issued before `typ` existed has none, and is rejected like any
  // other wrong kind: everyone signs in once more, nobody keeps a refresh
  // token that works as an access token.
  if (payload.typ !== typ) throw new Error(`Expected a ${typ} token`)
  if (typeof payload.sub !== "string") throw new Error("Token has no subject")
  if (payload.role !== "ADMIN" && payload.role !== "INSTRUCTOR") throw new Error("Bad role claim")
  return { sub: payload.sub, role: payload.role }
}

export const signAccessToken = (payload: JwtPayload) =>
  sign(payload, "access", env.JWT_ACCESS_EXPIRES_IN)

export const signRefreshToken = (payload: JwtPayload) =>
  sign(payload, "refresh", env.JWT_REFRESH_EXPIRES_IN)

/** The only verifier authMiddleware may use. */
export const verifyAccessToken = (token: string) => verify(token, "access")

/** For the future POST /auth/refresh (S-2). Never accept its result as a login. */
export const verifyRefreshToken = (token: string) => verify(token, "refresh")
