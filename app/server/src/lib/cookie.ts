/**
 * The one cookie the API sets: the refresh token (D-2, S-2). Hand-rolled
 * rather than a plugin because it is exactly one name, read on two routes.
 */
import type { FastifyReply, FastifyRequest } from "fastify"
import { env } from "./env.js"

export const REFRESH_COOKIE = "cmas_rt"
// Sent only to the auth routes, never to the rest of the API.
const PATH = "/api/v1/auth"

export function readCookie(request: FastifyRequest, name: string): string | undefined {
  const header = request.headers.cookie
  if (!header) return undefined
  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=")
    if (key === name) return decodeURIComponent(value.join("="))
  }
  return undefined
}

/** httpOnly so script cannot read it · SameSite=Strict so another site cannot send it · Secure outside development. */
export function setRefreshCookie(reply: FastifyReply, token: string, maxAgeSeconds: number) {
  const secure = env.NODE_ENV === "production" ? "; Secure" : ""
  reply.header(
    "Set-Cookie",
    `${REFRESH_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=${PATH}; Max-Age=${maxAgeSeconds}${secure}`,
  )
}

export function clearRefreshCookie(reply: FastifyReply) {
  reply.header(
    "Set-Cookie",
    `${REFRESH_COOKIE}=; HttpOnly; SameSite=Strict; Path=${PATH}; Max-Age=0`,
  )
}
