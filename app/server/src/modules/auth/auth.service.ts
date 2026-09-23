import type { User } from "@prisma/client"
import { isInstitutionDomain, verifyGoogleIdToken } from "../../lib/google.js"
import { signAccessToken, signRefreshToken } from "../../lib/jwt.js"
import { UserRepository } from "../users/user.repository.js"

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

export class AuthService {
  constructor(private readonly users: UserRepository) {}

  async loginWithGoogle(idToken: string): Promise<GoogleLoginResult> {
    let payload
    try {
      payload = await verifyGoogleIdToken(idToken)
    } catch {
      return { outcome: "invalid" }
    }
    if (!payload.emailVerified) return { outcome: "invalid" }

    let user = await this.users.findByGoogleSub(payload.sub)

    if (!user) {
      const existingByEmail = await this.users.findByEmail(payload.email)
      user = existingByEmail
        ? await this.users.linkGoogleSub(existingByEmail.id, payload.sub)
        : await this.users.createFromGoogle({
            email: payload.email,
            name: payload.name ?? payload.email,
            googleSub: payload.sub,
            status: isInstitutionDomain(payload) ? "ACTIVE" : "PENDING",
          })
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
}
