/** ExcelDeviceCode rows (0011). Only the SHA-256 of a deviceCode is stored or looked up. */
import { prisma } from "../../db/prisma.js"
import { hashToken } from "../auth/refresh-token.repository.js"

export class ExcelDeviceCodeRepository {
  /** Expired codes are worthless; sweeping them keeps the userCode space free. */
  async sweepExpired(now = new Date()) {
    await prisma.excelDeviceCode.deleteMany({ where: { expiresAt: { lt: now } } })
  }

  async create(deviceCode: string, userCode: string, expiresAt: Date) {
    await prisma.excelDeviceCode.create({
      data: { deviceCodeHash: hashToken(deviceCode), userCode, expiresAt },
    })
  }

  /** Approve once, only while unexpired. False when the code is unknown, used or expired. */
  async approve(userCode: string, userId: string, courseId: string): Promise<boolean> {
    const now = new Date()
    const updated = await prisma.excelDeviceCode.updateMany({
      where: { userCode, approvedAt: null, expiresAt: { gt: now } },
      data: { approvedAt: now, userId, courseId },
    })
    return updated.count === 1
  }

  async findByDeviceCode(deviceCode: string) {
    return prisma.excelDeviceCode.findUnique({
      where: { deviceCodeHash: hashToken(deviceCode) },
      select: {
        id: true,
        expiresAt: true,
        approvedAt: true,
        consumedAt: true,
        userId: true,
        courseId: true,
      },
    })
  }

  /**
   * Single use: mark the code consumed and create its token in one
   * transaction. Of two polls racing with one code only one gets a token.
   */
  consumeAndLink(
    id: string,
    link: { userId: string; courseId: string; token: string; expiresAt: Date },
  ) {
    return prisma.$transaction(async (tx) => {
      const used = await tx.excelDeviceCode.updateMany({
        where: { id, consumedAt: null, approvedAt: { not: null } },
        data: { consumedAt: new Date() },
      })
      if (used.count === 0) return null
      return tx.excelLink.create({
        data: {
          userId: link.userId,
          courseId: link.courseId,
          tokenHash: hashToken(link.token),
          expiresAt: link.expiresAt,
        },
        select: {
          id: true,
          expiresAt: true,
          course: {
            select: { id: true, code: true, name: true, section: true, semester: true, year: true },
          },
        },
      })
    })
  }
}
