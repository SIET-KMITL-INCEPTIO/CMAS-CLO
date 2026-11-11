import type { User } from "@prisma/client"
import { env } from "../../lib/env.js"
import { isInstitutionDomain, verifyGoogleIdToken } from "../../lib/google.js"
import { signAccessToken, signRefreshToken } from "../../lib/jwt.js"
import type { UserRepository } from "../users/user.repository.js"

export type PublicUser = Pick<User, "id" | "email" | "name" | "role" | "isActive" | "status">

type GoogleLoginResult =
  // Token failed verification (bad signature/audience/issuer/expiry), or
  // `email_verified` was false. Same outward response as "denied" — neither
  // should tell the caller which one happened.
  | { outcome: "invalid" }
  // A real, matched account that isn't allowed in right now (FR-03's
  // isActive = false kill switch). Same response as "invalid" for the
  // same reason.
  | { outcome: "denied" }
  // A real account still waiting on ADMIN approval (FR-08). Distinct from
  // "denied": the caller created this account themselves and is allowed to
  // know it exists and is pending — that's not the same information leak
  // FR-03 protects against.
  | { outcome: "pending" }
  | { outcome: "ok"; user: PublicUser; accessToken: string; refreshToken: string }

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    status: user.status,
  }
}

type AuthUsers = Pick<
  UserRepository,
  "findByGoogleSub" | "findByEmail" | "linkGoogleSub" | "createFromGoogle" | "grantAdmin"
> &
  Partial<Pick<UserRepository, "findProfile">>

export class AuthService {
  constructor(
    private readonly users: AuthUsers,
    // Lower-cased, from env.ADMIN_EMAILS (FR-05a). A parameter so tests can pass their own.
    private readonly adminEmails: readonly string[] = env.ADMIN_EMAILS,
  ) {}

  async loginWithGoogle(idToken: string): Promise<GoogleLoginResult> {
    let payload
    try {
      payload = await verifyGoogleIdToken(idToken)
    } catch {
      return { outcome: "invalid" }
    }
    if (!payload.emailVerified) return { outcome: "invalid" }

    // Safe to trust the email here: Google signed it and email_verified is true.
    const listedAdmin = this.adminEmails.includes(payload.email.toLowerCase())

    let user = await this.users.findByGoogleSub(payload.sub)

    if (!user) {
      const existingByEmail = await this.users.findByEmail(payload.email)
      user = existingByEmail
        ? await this.users.linkGoogleSub(existingByEmail.id, payload.sub)
        : await this.users.createFromGoogle({
            email: payload.email,
            name: payload.name ?? payload.email,
            googleSub: payload.sub,
            role: listedAdmin ? "ADMIN" : "INSTRUCTOR",
            status: listedAdmin || isInstitutionDomain(payload) ? "ACTIVE" : "PENDING",
          })
    }

    // FR-05a: promote an existing listed account, but never one an ADMIN has
    // switched off (FR-03 wins), and never demote — taking an email off the
    // list leaves the role to be changed by hand.
    if (listedAdmin && user.isActive && (user.role !== "ADMIN" || user.status !== "ACTIVE")) {
      user = await this.users.grantAdmin(user.id)
    }

    if (!user.isActive) return { outcome: "denied" }
    if (user.status === "PENDING") return { outcome: "pending" }

    const jwtPayload = { sub: user.id, role: user.role }
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(jwtPayload),
      signRefreshToken(jwtPayload),
    ])

    return { outcome: "ok", user: toPublicUser(user), accessToken, refreshToken }
  }

  /** GET /auth/me — the live row (NFR-19), not the token's claims. */
  async me(userId: string) {
    const user = await this.users.findProfile?.(userId)
    if (!user) return null
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      courseCount: user.courseAssignments.length,
    }
  }
}
