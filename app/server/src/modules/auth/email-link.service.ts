/**
 * FR-07: sign in with a one-time link sent by email. No password anywhere.
 *
 * - Asking for a link answers the same for every well-formed address, whether
 *   or not it has an account, is suspended or is pending (FR-07, FR-03): the
 *   form must not tell a stranger which addresses exist.
 * - Opening the link proves the mailbox. Only then is an account created, under
 *   the same rule as Google (FR-08): the faculty domain is ACTIVE, any other
 *   domain PENDING until an ADMIN approves; ADMIN_EMAILS become ADMIN (FR-05a).
 * - A suspended account is named only after the link is opened, when the
 *   person has proven they own it (FR-03).
 */
import { randomBytes } from "node:crypto"
import { env } from "../../lib/env.js"
import { isInstitutionEmail } from "../../lib/google.js"
import { signAccessToken, signRefreshToken } from "../../lib/jwt.js"
import type { Mailer } from "../../lib/mailer.js"
import type { UserRepository } from "../users/user.repository.js"
import type { PublicUser } from "./auth.service.js"
import type { EmailLinkRepository } from "./email-link.repository.js"

export const LINK_TTL_MS = 24 * 60 * 60 * 1000
export const RESEND_AFTER_MS = 60 * 1000

type Users = Pick<
  UserRepository,
  "findByEmailInsensitive" | "createFromEmail" | "markEmailVerified" | "grantAdmin"
>
type Links = Pick<EmailLinkRepository, "lastIssuedAt" | "issue" | "consume">

export type RequestResult = { outcome: "sent" } | { outcome: "unavailable" }

export type VerifyResult =
  // Unknown, used, superseded or expired. One answer for all of them.
  | { outcome: "invalid" }
  | { outcome: "suspended" }
  | { outcome: "pending"; email: string; userId: string; registered: boolean }
  | {
      outcome: "ok"
      user: PublicUser
      accessToken: string
      refreshToken: string
      registered: boolean
    }

export class EmailLinkService {
  constructor(
    private readonly users: Users,
    private readonly links: Links,
    private readonly mailer: Mailer | null,
    private readonly adminEmails: readonly string[] = env.ADMIN_EMAILS,
    private readonly appUrl: string = env.CORS_ORIGIN,
    // Never the address or the link: a send failure is logged without either.
    // authRoutes passes the Fastify logger; this fallback only serves code built without one.
    private readonly onMailError: (err: unknown) => void = (err) =>
      console.error("sign-in link email failed:", (err as Error).message),
  ) {}

  /** `email` is already validated and lower-cased by the validator. */
  async request(email: string): Promise<RequestResult> {
    if (!this.mailer) return { outcome: "unavailable" }

    // FR-07: one link per email per 60 seconds. A second ask inside that window
    // reads exactly like a sent one, so it says nothing about the address.
    const last = await this.links.lastIssuedAt(email)
    if (last && Date.now() - last.getTime() < RESEND_AFTER_MS) return { outcome: "sent" }

    const user = await this.users.findByEmailInsensitive(email)
    const token = randomBytes(32).toString("base64url")
    await this.links.issue(email, user?.id ?? null, token, new Date(Date.now() + LINK_TTL_MS))

    // In the fragment, not the query: a fragment never reaches a server log or a Referer header.
    const url = `${this.appUrl}/auth/link#${token}`
    // Not awaited: the answer must not take longer for one address than another
    // (api-design #2), and a mail server's delay is not the caller's to wait on.
    void this.mailer
      .send({
        to: email,
        subject: "ลิงก์เข้าสู่ระบบ CMAS",
        text:
          `เปิดลิงก์นี้เพื่อเข้าสู่ระบบ CMAS:\n${url}\n\n` +
          "ลิงก์ใช้ได้ครั้งเดียวและหมดอายุใน 24 ชั่วโมง · ถ้าคุณไม่ได้ขอ ไม่ต้องทำอะไร",
        html:
          `<p>เปิดลิงก์นี้เพื่อเข้าสู่ระบบ CMAS</p>` +
          `<p><a href="${url}">เข้าสู่ระบบ CMAS</a></p>` +
          `<p style="color:#666">ลิงก์ใช้ได้ครั้งเดียวและหมดอายุใน 24 ชั่วโมง · ถ้าคุณไม่ได้ขอ ไม่ต้องทำอะไร</p>`,
      })
      .catch(this.onMailError)
    return { outcome: "sent" }
  }

  async verify(token: string): Promise<VerifyResult> {
    const email = await this.links.consume(token)
    if (!email) return { outcome: "invalid" }

    const listedAdmin = this.adminEmails.includes(email)
    let user = await this.users.findByEmailInsensitive(email)
    const registered = !user
    if (!user) {
      user = await this.users.createFromEmail({
        email,
        role: listedAdmin ? "ADMIN" : "INSTRUCTOR",
        status: listedAdmin || isInstitutionEmail(email) ? "ACTIVE" : "PENDING",
      })
    } else if (!user.emailVerifiedAt) {
      user = await this.users.markEmailVerified(user.id)
    }

    // FR-05a, as for Google: promote, never demote, never revive a switched-off account.
    if (listedAdmin && user.isActive && (user.role !== "ADMIN" || user.status !== "ACTIVE"))
      user = await this.users.grantAdmin(user.id)

    if (!user.isActive) return { outcome: "suspended" }
    if (user.status === "PENDING")
      return { outcome: "pending", email: user.email, userId: user.id, registered }

    const payload = { sub: user.id, role: user.role }
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(payload),
      signRefreshToken(payload),
    ])
    return {
      outcome: "ok",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        status: user.status,
      },
      accessToken,
      refreshToken,
      registered,
    }
  }
}
