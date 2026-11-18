/** EmailVerificationToken rows (FR-07). Only the SHA-256 of a link's token is stored or looked up. */
import { prisma } from "../../db/prisma.js"
import { hashToken } from "./refresh-token.repository.js"

export class EmailLinkRepository {
  /** When the newest link for this email was issued, for the 60-second resend limit. */
  async lastIssuedAt(email: string): Promise<Date | null> {
    const row = await prisma.emailVerificationToken.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    })
    return row?.createdAt ?? null
  }

  /** A new link retires every unused older one for the same email, in one transaction. */
  async issue(email: string, userId: string | null, token: string, expiresAt: Date) {
    await prisma.$transaction([
      prisma.emailVerificationToken.updateMany({
        where: { email, usedAt: null },
        data: { usedAt: new Date() },
      }),
      prisma.emailVerificationToken.create({
        data: { email, userId, tokenHash: hashToken(token), expiresAt },
      }),
    ])
  }

  /**
   * Single use: the row is marked used only if it is still unused and unexpired,
   * so of two requests racing with one link only one gets the email back.
   */
  async consume(token: string): Promise<string | null> {
    const tokenHash = hashToken(token)
    const now = new Date()
    const used = await prisma.emailVerificationToken.updateMany({
      where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    })
    if (used.count === 0) return null
    const row = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      select: { email: true },
    })
    return row?.email ?? null
  }
}
