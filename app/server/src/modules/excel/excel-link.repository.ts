/** ExcelLink rows (0011): the add-in's course-scoped tokens. Only SHA-256 hashes are stored. */
import { prisma } from "../../db/prisma.js"
import { hashToken } from "../auth/refresh-token.repository.js"

/** lastUsedAt is written at most once a minute, not on every 10-second poll. */
const TOUCH_EVERY_MS = 60_000

export class ExcelLinkRepository {
  /** The live link for a token, or null when it is unknown, revoked or expired. */
  async findLive(token: string, now = new Date()) {
    return prisma.excelLink.findFirst({
      where: { tokenHash: hashToken(token), revokedAt: null, expiresAt: { gt: now } },
      select: { id: true, userId: true, courseId: true },
    })
  }

  async touch(id: string, now = new Date()) {
    await prisma.excelLink.updateMany({
      where: {
        id,
        OR: [
          { lastUsedAt: null },
          { lastUsedAt: { lt: new Date(now.getTime() - TOUCH_EVERY_MS) } },
        ],
      },
      data: { lastUsedAt: now },
    })
  }

  async listLive(userId: string, now = new Date()) {
    return prisma.excelLink.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
        course: { select: { id: true, code: true, name: true, section: true } },
      },
    })
  }

  /** Only the owner's own link. False for someone else's, an unknown id or one already revoked. */
  async revoke(userId: string, id: string): Promise<boolean> {
    const updated = await prisma.excelLink.updateMany({
      where: { id, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    return updated.count === 1
  }
}
