import { createHash, createHmac } from "node:crypto"
import { PrismaClient } from "@prisma/client"
import type { Page } from "@playwright/test"

export const API = "http://localhost:3001/api/v1"

export const prisma = new PrismaClient()

type Role = "ADMIN" | "INSTRUCTOR"
type TokenOptions = { typ?: "access" | "refresh"; secret?: string }

const base64url = (value: string) => Buffer.from(value).toString("base64url")

/**
 * An HS256 token in the exact shape app/server/src/lib/jwt.ts signs. Minted
 * here so the smoke run never needs Google; the server can't tell the
 * difference, which is the point: it is the server's checks under test.
 */
export function signToken(sub: string, role: Role, options: TokenOptions = {}): string {
  const secret = options.secret ?? process.env.JWT_SECRET
  if (!secret) throw new Error("JWT_SECRET must be set for the E2E run")

  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: "HS256" }))
  const payload = base64url(
    JSON.stringify({ sub, role, typ: options.typ ?? "access", iat: now, exp: now + 600 }),
  )
  const signature = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url")
  return `${header}.${payload}.${signature}`
}

export async function seededUser(email: string) {
  return prisma.user.findUniqueOrThrow({
    where: { email },
    select: { id: true, email: true, name: true, role: true, isActive: true, status: true },
  })
}

/**
 * Signs `email` in the way a real browser holds a session (D-2, S-2): a signed
 * refresh token in the httpOnly `cmas_rt` cookie, and its SHA-256 in the
 * RefreshToken table. The app then trades it for an access token through
 * POST /auth/refresh, exactly as it does after a page reload.
 */
export async function signInAs(page: Page, email: string) {
  const user = await seededUser(email)
  const token = signToken(user.id, user.role, { typ: "refresh" })
  const tokenHash = createHash("sha256").update(token).digest("hex")

  const row = await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      familyId: "",
      expiresAt: new Date(Date.now() + 600_000),
    },
  })
  // A new sign-in starts its own family, named after its first token.
  await prisma.refreshToken.update({ where: { id: row.id }, data: { familyId: row.id } })

  await page.context().addCookies([
    {
      name: "cmas_rt",
      value: encodeURIComponent(token),
      domain: "localhost",
      path: "/api/v1/auth",
      httpOnly: true,
      sameSite: "Strict",
      expires: Math.floor(Date.now() / 1000) + 600,
    },
  ])
  return user
}
