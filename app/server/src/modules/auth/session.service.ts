/**
 * Sessions after sign-in (D-2, S-2): the refresh token lives in an httpOnly
 * cookie and in the RefreshToken table as a hash, rotates on every use, and
 * dies on logout. The access token is not revocable — it simply runs out
 * (15 minutes), and authMiddleware re-reads the User row on every request anyway.
 */
import { env } from "../../lib/env.js"
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt.js"
import type { AuthEventRepository } from "../users/auth-event.repository.js"
import type { UserRepository } from "../users/user.repository.js"
import type { RefreshTokenRepository } from "./refresh-token.repository.js"

const UNIT_MS = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const

/** "7d" / "15m" / "3600s" → milliseconds. The env schema already constrains the format. */
export function durationMs(value: string): number {
  const match = /^(\d+)\s*([smhd])$/.exec(value.trim())
  if (!match) throw new Error(`Unreadable duration "${value}"`)
  return Number(match[1]) * UNIT_MS[match[2] as keyof typeof UNIT_MS]
}

export const REFRESH_TTL_MS = durationMs(env.JWT_REFRESH_EXPIRES_IN)

type RefreshResult =
  | { outcome: "ok"; accessToken: string; refreshToken: string }
  // One answer for every failure: missing, forged, expired, revoked, reused, account off.
  | { outcome: "invalid" }

export class SessionService {
  constructor(
    private readonly tokens: RefreshTokenRepository,
    private readonly users: Pick<UserRepository, "findById">,
    private readonly events: AuthEventRepository,
  ) {}

  /** A successful Google sign-in: store the refresh token's hash as a new family. */
  async start(userId: string, refreshToken: string) {
    await this.tokens.create(userId, refreshToken, null, new Date(Date.now() + REFRESH_TTL_MS))
    await this.events.record(userId, userId, "LOGIN_GOOGLE")
  }

  async refresh(presented: string | undefined): Promise<RefreshResult> {
    if (!presented) return { outcome: "invalid" }
    try {
      await verifyRefreshToken(presented) // S-1: a refresh token, signed by us, not expired
    } catch {
      return { outcome: "invalid" }
    }

    const row = await this.tokens.findByToken(presented)
    if (!row) return { outcome: "invalid" }
    if (row.revokedAt) {
      await this.tokens.revokeFamily(row.familyId)
      return { outcome: "invalid" }
    }
    if (row.expiresAt <= new Date()) return { outcome: "invalid" }

    // NFR-19: the live row decides, not the role claim inside the token.
    const user = await this.users.findById(row.userId)
    if (!user || !user.isActive || user.status !== "ACTIVE") {
      await this.tokens.revokeFamily(row.familyId)
      return { outcome: "invalid" }
    }

    const payload = { sub: user.id, role: user.role }
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(payload),
      signRefreshToken(payload),
    ])
    const rotated = await this.tokens.rotate(
      row.id,
      user.id,
      row.familyId,
      refreshToken,
      new Date(Date.now() + REFRESH_TTL_MS),
    )
    if (!rotated) {
      await this.tokens.revokeFamily(row.familyId) // lost a race with the same token: reuse
      return { outcome: "invalid" }
    }
    return { outcome: "ok", accessToken, refreshToken }
  }

  /** Revokes this browser's refresh token. Access tokens already issued run out on their own. */
  async end(userId: string, presented: string | undefined) {
    if (presented) {
      const row = await this.tokens.findByToken(presented)
      if (row && row.userId === userId) await this.tokens.revokeFamily(row.familyId)
    }
    await this.events.record(userId, userId, "LOGOUT")
  }
}
