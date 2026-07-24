import { SignJWT, jwtVerify } from "jose"
import { env } from "./env.js"

const secret = new TextEncoder().encode(env.JWT_SECRET)

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
