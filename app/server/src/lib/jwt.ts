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

export async function signAccessToken(payload: JwtPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_EXPIRES_IN)
    .sign(secret)
}

export async function signRefreshToken(payload: JwtPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRES_IN)
    .sign(secret)
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secret)
  return payload as unknown as JwtPayload
}
