/**
 * UC 1.6 account history (AuthEvent, migration 0008). Written by modules/auth
 * (sign-in, sign-out), modules/users (role and status changes) and the access
 * hook (refused actions, S-10). `detail` never carries student data (S-4).
 */
import type { AuthEventAction } from "@prisma/client"
import { prisma } from "../../db/prisma.js"

export class AuthEventRepository {
  async record(userId: string, actorId: string, action: AuthEventAction, detail?: string) {
    await prisma.authEvent.create({ data: { userId, actorId, action, detail } })
  }

  async list(userId: string, action: AuthEventAction | undefined, skip: number, take: number) {
    const where = { userId, ...(action ? { action } : {}) }
    const [total, rows] = await prisma.$transaction([
      prisma.authEvent.count({ where }),
      prisma.authEvent.findMany({
        where,
        orderBy: { at: "desc" },
        skip,
        take,
        select: {
          id: true,
          action: true,
          actorId: true,
          at: true,
          detail: true,
          actor: { select: { name: true } },
        },
      }),
    ])
    return { total, rows }
  }
}
