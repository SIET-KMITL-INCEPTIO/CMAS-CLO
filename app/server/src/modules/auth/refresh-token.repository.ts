/** RefreshToken rows (D-2). Only the SHA-256 of a token is ever stored or looked up. */
import { createHash } from "node:crypto"
import { prisma } from "../../db/prisma.js"

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex")

export class RefreshTokenRepository {
  async create(userId: string, token: string, familyId: string | null, expiresAt: Date) {
    const row = await prisma.refreshToken.create({
      data: { userId, tokenHash: hashToken(token), familyId: familyId ?? "", expiresAt },
      select: { id: true, familyId: true },
    })
    // A new sign-in starts its own family, named after its first token.
    if (!familyId)
      await prisma.refreshToken.update({ where: { id: row.id }, data: { familyId: row.id } })
    return row.id
  }

  findByToken(token: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { id: true, userId: true, familyId: true, expiresAt: true, revokedAt: true },
    })
  }

  /**
   * Rotation: revoke `id` and issue its successor in one transaction. The
   * revoke is conditional, so of two requests racing with the same token
   * only one wins; the loser gets null and is treated as reuse.
   */
  rotate(id: string, userId: string, familyId: string, next: string, expiresAt: Date) {
    return prisma.$transaction(async (tx) => {
      const revoked = await tx.refreshToken.updateMany({
        where: { id, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      if (revoked.count === 0) return null
      const created = await tx.refreshToken.create({
        data: { userId, familyId, tokenHash: hashToken(next), expiresAt },
        select: { id: true },
      })
      await tx.refreshToken.update({ where: { id }, data: { replacedBy: created.id } })
      return created.id
    })
  }

  /** S-2: a revoked token presented again means it was copied — end every session it led to. */
  async revokeFamily(familyId: string) {
    await prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }
}
