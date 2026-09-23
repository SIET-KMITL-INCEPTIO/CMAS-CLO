/**
 * The only file that touches `prisma.user`. Shared by modules/users (account
 * management) and modules/auth (login/registration needs the same rows) —
 * the User model has one owner, this module, rather than two repositories
 * drifting apart on the same table.
 */
import type { AccountStatus, User } from "@prisma/client"
import { prisma } from "../../db/prisma.js"

export class UserRepository {
  findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } })
  }

  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } })
  }

  findByGoogleSub(googleSub: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { googleSub } })
  }

  /**
   * First-ever Google sign-in for this email (FR-08). Always created as
   * INSTRUCTOR — self-registration, by Google or by email, never grants
   * ADMIN (FR-05 reserves that to an existing admin).
   */
  createFromGoogle(data: {
    email: string
    name: string
    googleSub: string
    status: AccountStatus
  }): Promise<User> {
    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        googleSub: data.googleSub,
        authProvider: "GOOGLE",
        role: "INSTRUCTOR",
        status: data.status,
        emailVerifiedAt: new Date(), // Google already verified it (email_verified)
      },
    })
  }

  /** An existing EMAIL account signing in with Google for the first time. */
  linkGoogleSub(userId: string, googleSub: string): Promise<User> {
    return prisma.user.update({ where: { id: userId }, data: { googleSub } })
  }

  listByStatus(status?: AccountStatus) {
    return prisma.user.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        status: true,
        authProvider: true,
        createdAt: true,
      },
    })
  }

  approve(id: string): Promise<User> {
    return prisma.user.update({ where: { id }, data: { status: "ACTIVE" } })
  }
}
