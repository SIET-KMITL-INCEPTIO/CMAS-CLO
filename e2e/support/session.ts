import { createHmac } from "node:crypto"
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

/** Signs `email` in the way Login.page.tsx does: the persisted zustand store. */
export async function signInAs(page: Page, email: string) {
  const user = await seededUser(email)
  const accessToken = signToken(user.id, user.role)
  const stored = JSON.stringify({ state: { user, accessToken }, version: 0 })
  await page.addInitScript((value) => window.localStorage.setItem("clo-auth", value), stored)
  return user
}
